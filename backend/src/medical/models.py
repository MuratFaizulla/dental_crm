import os
import uuid

from django.db import models
from django.conf import settings
from client.models import Client
from doctors.models import Service


def patient_file_path(instance, filename):
    from datetime import date
    today = date.today()
    ext = os.path.splitext(filename)[1].lower()
    return f'patients/{instance.patient_id}/{today.year}/{today.month}/{uuid.uuid4().hex}{ext}'


class MedicalNote(models.Model):
    patient = models.OneToOneField(Client, on_delete=models.CASCADE, related_name='medical_note')
    anamnesis = models.TextField(blank=True, default='')
    allergies = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='+'
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Медицинская заметка'
        verbose_name_plural = 'Медицинские заметки'

    def __str__(self):
        return f'Медкарта: {self.patient}'


class ToothRecord(models.Model):
    TOOTH_TYPE_CHOICES = [('permanent', 'Постоянный'), ('primary', 'Молочный')]
    STATUS_CHOICES = [
        ('healthy', 'Здоров'),
        ('treated', 'Пролечен'),
        ('urgent', 'Срочно'),
        ('observation', 'Наблюдение'),
        ('missing', 'Отсутствует'),
    ]

    patient = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='tooth_records')
    tooth_number = models.CharField(max_length=2)
    tooth_type = models.CharField(max_length=10, choices=TOOTH_TYPE_CHOICES, default='permanent')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='healthy')
    notes = models.TextField(blank=True, default='')
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='+'
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('patient', 'tooth_number')]
        verbose_name = 'Статус зуба'
        verbose_name_plural = 'Статусы зубов'

    def __str__(self):
        return f'Зуб {self.tooth_number} — {self.patient}'


class TreatmentPlanItem(models.Model):
    STATUS_CHOICES = [
        ('planned', 'Запланировано'),
        ('in_progress', 'В процессе'),
        ('done', 'Завершено'),
        ('postponed', 'Отложено'),
    ]

    patient = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='treatment_plan')
    tooth_number = models.CharField(max_length=2)
    diagnosis = models.TextField()
    treatment = models.TextField()
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='planned')
    postpone_reason = models.TextField(blank=True, default='')
    linked_record = models.ForeignKey(
        'records.Record', on_delete=models.SET_NULL, null=True, blank=True
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='treatment_items'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Пункт плана лечения'
        verbose_name_plural = 'Пункты плана лечения'
        ordering = ['-created_at']

    def __str__(self):
        return f'Зуб {self.tooth_number}: {self.diagnosis[:40]}'


class PatientFile(models.Model):
    FILE_TYPE_CHOICES = [
        ('xray', 'Рентген'),
        ('photo', 'Фото'),
        ('document', 'Документ'),
        ('other', 'Другое'),
    ]

    patient = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='patient_files')
    file = models.FileField(upload_to=patient_file_path)
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    description = models.CharField(max_length=255, blank=True, default='')
    tooth_number = models.CharField(max_length=2, null=True, blank=True)
    linked_record = models.ForeignKey(
        'records.Record', on_delete=models.SET_NULL, null=True, blank=True
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='+'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Файл пациента'
        verbose_name_plural = 'Файлы пациентов'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.get_file_type_display()} — {self.patient}'
