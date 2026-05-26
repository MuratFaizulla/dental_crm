from django.db import models

from records.models import Record


class SMSTemplate(models.Model):
    name = models.CharField('Название', max_length=100, unique=True)
    text = models.TextField('Текст шаблона')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'SMS-шаблон'
        verbose_name_plural = 'SMS-шаблоны'

    def __str__(self) -> str:
        return self.name


class SMSLog(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_SENT = 'sent'
    STATUS_DELIVERED = 'delivered'
    STATUS_ERROR = 'error'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Ожидает'),
        (STATUS_SENT, 'Отправлено'),
        (STATUS_DELIVERED, 'Доставлено'),
        (STATUS_ERROR, 'Ошибка'),
    ]

    TYPE_MANUAL = 'manual'
    TYPE_REMIND_24H = 'remind_24h'
    TYPE_REMIND_2H = 'remind_2h'
    TYPE_CHOICES = [
        (TYPE_MANUAL, 'Ручная'),
        (TYPE_REMIND_24H, 'За 24 часа'),
        (TYPE_REMIND_2H, 'За 2 часа'),
    ]

    record = models.ForeignKey(
        Record, on_delete=models.CASCADE, related_name='sms_logs',
        null=True, blank=True,
    )
    phone = models.CharField('Телефон', max_length=20)
    message = models.TextField('Сообщение')
    sms_type = models.CharField('Тип', max_length=20, choices=TYPE_CHOICES, default=TYPE_MANUAL)
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    provider_response = models.TextField('Ответ провайдера', blank=True, default='')
    sent_at = models.DateTimeField('Отправлено', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'SMS-лог'
        verbose_name_plural = 'SMS-логи'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'{self.phone} — {self.get_sms_type_display()} — {self.get_status_display()}'
