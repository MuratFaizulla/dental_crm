from django.db import models


class ClinicSettings(models.Model):
    name          = models.CharField('Название клиники', max_length=255, default='Стоматологическая клиника')
    address       = models.TextField('Адрес', blank=True, default='')
    phone         = models.CharField('Телефон', max_length=50, blank=True, default='')
    email         = models.EmailField('Email', blank=True, default='')
    working_hours = models.JSONField('Рабочие часы', default=dict)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Настройки клиники'
        verbose_name_plural = 'Настройки клиники'

    def __str__(self) -> str:
        return self.name
