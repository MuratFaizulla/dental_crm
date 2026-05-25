from django.db import models
from client.models import Client
from doctors.models import Doctors, Assistant, Service, Specialization

class Status(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        verbose_name = "Статус"
        verbose_name_plural = "Статусы"

class RecordsLog(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)
    
    def __str__(self):
        return self.title

class ChairNum(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)
    
    def __str__(self):
        return self.title

    
    class Meta:
        verbose_name = "Номер кабинета"
        verbose_name_plural = "Номера кабинетов"

class RecordingType(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)
    
    def __str__(self):
        return self.title

    
    class Meta:
        verbose_name = "Тип записи"
        verbose_name_plural = "Типы записей"


class PaymentType(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)
    
    def __str__(self):
        return self.title

    
    class Meta:
        verbose_name = "Тип оплаты"
        verbose_name_plural = "Типы оплат"


class PaymentState(models.Model):
    title = models.CharField(max_length=255)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)
    
    def __str__(self):
        return self.title
    
    
    class Meta:
        verbose_name = "Состояние оплаты"
        verbose_name_plural = "Состояния оплат"
        
class Record(models.Model):
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True)
    client_first_name = models.CharField(max_length=255, default='default_first_name')
    client_last_name = models.CharField(max_length=255, default='default_last_name')
    client_father_name = models.CharField(max_length=255, null=True, blank=True, default='default_father_name')
    doctor = models.ForeignKey(Doctors, on_delete=models.SET_NULL, null=True)
    doctors_name = models.CharField(max_length=255, default='default_doctors_name')
    assistant = models.ForeignKey(Assistant, on_delete=models.SET_NULL, null=True)
    assistant_name = models.CharField(max_length=255, default='default_assistant_name')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    specialization = models.ForeignKey(Specialization, verbose_name="Специализация", on_delete=models.CASCADE)
    tooth = models.IntegerField("Зубы", default=0)
    specialization_cost = models.IntegerField("Цена", default=0)
    count = models.IntegerField("Количество", default=0)
    sell = models.IntegerField("Акции", default=0)
    total = models.IntegerField("Итого", default=0)
    registration_date = models.DateField("Дата приема", default='datetime.date.today')
    record_start = models.DateField("Время начала", default='datetime.date.today')
    record_end = models.DateField("Время окончания", default='datetime.date.today')
    recording_type = models.ForeignKey(RecordingType, verbose_name="Тип записи", on_delete=models.SET_NULL, null=True)
    notes = models.TextField("Примечания", blank=True, default='')
    reason = models.TextField("Причина", blank=True, default='')
    reception_day = models.DateField(default='datetime.date.today', db_index=True)
    chair = models.ForeignKey(ChairNum, verbose_name="Номер кабинета", on_delete=models.SET_NULL, null=True)
    payment_type = models.ForeignKey(PaymentType, verbose_name="Тип оплаты", on_delete=models.SET_NULL, null=True)
    payment_state = models.ForeignKey(PaymentState, verbose_name="Состояние оплаты", on_delete=models.SET_NULL, null=True)
    status = models.ForeignKey(Status, on_delete=models.CASCADE)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)

    class Meta:
        verbose_name = "Запись"
        verbose_name_plural = "Записи"
