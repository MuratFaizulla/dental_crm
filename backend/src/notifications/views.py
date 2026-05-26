import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from api.permissions import IsAdmin, IsAdminOrDoctor
from records.models import Record
from .models import SMSLog
from .tasks import send_sms_task

logger = logging.getLogger(__name__)


class SendSMSView(APIView):
    """POST /api/v1/notifications/send/<record_id>/ — ручная отправка напоминания."""

    permission_classes = [IsAdminOrDoctor]

    def post(self, request, record_id: int):
        try:
            record = Record.objects.select_related('client').get(pk=record_id)
        except Record.DoesNotExist:
            return Response({'detail': 'Запись не найдена.'}, status=status.HTTP_404_NOT_FOUND)

        phone = record.client.mobile_phone if record.client else None
        if not phone:
            return Response({'detail': 'У пациента не указан телефон.'}, status=status.HTTP_400_BAD_REQUEST)

        time_str = record.record_start.strftime('%H:%M') if record.record_start else ''
        date_str = record.reception_day.strftime('%d.%m.%Y') if record.reception_day else ''
        message = (
            f'Напоминаем о вашем приёме {date_str} в {time_str}. '
            f'Клиника «Dental CRM». Ждём вас!'
        )

        log = SMSLog.objects.create(
            record=record,
            phone=phone,
            message=message,
            sms_type=SMSLog.TYPE_MANUAL,
        )
        send_sms_task.delay(log.pk)

        return Response({'detail': 'SMS поставлен в очередь.', 'sms_log_id': log.pk})


class SMSLogListView(APIView):
    """GET /api/v1/notifications/log/ — история отправок."""

    permission_classes = [IsAdmin]

    def get(self, request):
        qs = SMSLog.objects.select_related('record').order_by('-created_at')[:200]
        data = [
            {
                'id': log.id,
                'phone': log.phone,
                'message': log.message,
                'sms_type': log.sms_type,
                'sms_type_display': log.get_sms_type_display(),
                'status': log.status,
                'status_display': log.get_status_display(),
                'record_id': log.record_id,
                'sent_at': log.sent_at.isoformat() if log.sent_at else None,
                'created_at': log.created_at.isoformat(),
            }
            for log in qs
        ]
        return Response(data)
