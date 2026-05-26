from django.conf import settings
from django.db import models

from records.models import Record


class Payment(models.Model):
    CASH = 'cash'
    CARD = 'card'
    TRANSFER = 'transfer'
    TYPE_CHOICES = [
        (CASH, 'Наличные'),
        (CARD, 'Карта'),
        (TRANSFER, 'Перевод'),
    ]

    record = models.ForeignKey(Record, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField('Сумма', max_digits=10, decimal_places=2)
    payment_type = models.CharField('Тип оплаты', max_length=10, choices=TYPE_CHOICES, default=CASH)
    paid_at = models.DateTimeField('Дата оплаты', auto_now_add=True, db_index=True)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Принял',
    )
    notes = models.TextField('Заметки', blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Платёж'
        verbose_name_plural = 'Платежи'
        ordering = ['-paid_at']

    def __str__(self) -> str:
        return f'Платёж {self.amount} — запись #{self.record_id}'
