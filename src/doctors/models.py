from django.db import models
from django.conf import settings

class Specialization(models.Model):
    title = models.CharField("Название специализации", max_length=255)
    cost = models.IntegerField("Стоимость услуги")
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        verbose_name = "Специализация"
        verbose_name_plural = "Специализации"

class Service(models.Model):
    title = models.CharField("Название услуги", max_length=255)
    spec_id = models.ForeignKey(Specialization, verbose_name="Специализация", on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        verbose_name = "Услуга"
        verbose_name_plural = "Услуги"

class Doctors(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='doctors_profile',
    )
    first_name = models.CharField("Имя", max_length=255)
    last_name = models.CharField("Фамилия", max_length=255)
    father_name = models.CharField("Отчество", max_length=255)
    body = models.TextField(blank=True, default='')
    services_id = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


    class Meta:
        verbose_name = "Врач"
        verbose_name_plural = "Врачи"

class Assistant(models.Model):
    first_name = models.CharField("Имя", max_length=255)
    last_name = models.CharField("Фамилия", max_length=255)
    father_name = models.CharField("Отчество", max_length=255)
    body = models.TextField()
    services_id = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True, null=True)
    updated_at = models.DateTimeField("Дата обновления", auto_now=True, null=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    
    class Meta:
        verbose_name = "Ассистент"
        verbose_name_plural = "Ассистенты"

