import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(queue='reminders', bind=True, max_retries=3)
def send_sms_task(self, sms_log_id: int) -> str:
    from notifications.models import SMSLog
    from notifications.sms_providers import get_provider

    try:
        log = SMSLog.objects.get(pk=sms_log_id)
    except SMSLog.DoesNotExist:
        return f'SMSLog {sms_log_id} not found'

    provider = get_provider()
    success, response = provider.send(log.phone, log.message)

    log.provider_response = response
    log.sent_at = timezone.now()
    log.status = SMSLog.STATUS_SENT if success else SMSLog.STATUS_ERROR
    log.save(update_fields=['status', 'provider_response', 'sent_at'])

    if not success:
        raise self.retry(countdown=60 * (self.request.retries + 1))

    return f'sent:{log.phone}'


@shared_task(queue='reminders')
def schedule_appointment_reminders() -> str:
    """Run every 5 minutes via celery-beat. Queues reminders for upcoming appointments."""
    from notifications.models import SMSLog
    from records.models import Record

    now = timezone.localtime()
    today = now.date()
    sent_count = 0

    # Window: appointments within next 24h–25h (remind_24h)
    window_24h_start = (now + timedelta(hours=24)).time()
    window_24h_end = (now + timedelta(hours=25)).time()

    # Window: appointments within next 2h–2h5m (remind_2h)
    window_2h_start = (now + timedelta(hours=2)).time()
    window_2h_end = (now + timedelta(hours=2, minutes=5)).time()

    def _should_send(record: 'Record', sms_type: str) -> bool:
        return not SMSLog.objects.filter(record=record, sms_type=sms_type).exists()

    for sms_type, t_start, t_end in [
        (SMSLog.TYPE_REMIND_24H, window_24h_start, window_24h_end),
        (SMSLog.TYPE_REMIND_2H, window_2h_start, window_2h_end),
    ]:
        records = (
            Record.objects
            .filter(reception_day=today, record_start__range=(t_start, t_end))
            .select_related('client')
        )
        for record in records:
            phone = record.client.mobile_phone if record.client else None
            if not phone or not _should_send(record, sms_type):
                continue

            label = 'через 24 часа' if sms_type == SMSLog.TYPE_REMIND_24H else 'через 2 часа'
            time_str = record.record_start.strftime('%H:%M') if record.record_start else ''
            message = (
                f'Напоминаем: у вас приём {label} ({time_str}). '
                f'Клиника «Dental CRM». Ждём вас!'
            )

            log = SMSLog.objects.create(
                record=record,
                phone=phone,
                message=message,
                sms_type=sms_type,
            )
            send_sms_task.delay(log.pk)
            sent_count += 1

    return f'queued:{sent_count}'
