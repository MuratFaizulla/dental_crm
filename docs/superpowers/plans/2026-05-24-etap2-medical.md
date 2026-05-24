# Этап 2: Медкарта пациента — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить медкарту пациента: анамнез, интерактивная SVG зубная формула (FDI), план лечения, хранение файлов (рентген, фото, документы).

**Architecture:** Новое Django-приложение `medical` с 4 моделями (MedicalNote, ToothRecord, TreatmentPlanItem, PatientFile) внутри существующего проекта. 11 REST-эндпоинтов с разграничением доступа (admin/doctor). React-фронтенд: страница пациента с 3 вкладками, SVG зубная формула, список плана лечения, загрузка файлов. Всё в том же Docker Compose.

**Tech Stack:** Django 5 + DRF, PostgreSQL, React + TypeScript + CSS Modules, TanStack Query, React Router v7, кастомный SVG

---

## File Map

### Backend
- **Create** `src/medical/__init__.py`
- **Create** `src/medical/apps.py`
- **Create** `src/medical/models.py` — ToothRecord, TreatmentPlanItem, PatientFile, MedicalNote
- **Create** `src/medical/serializers.py`
- **Create** `src/medical/views.py`
- **Create** `src/medical/urls.py`
- **Create** `src/medical/admin.py`
- **Create** `src/medical/tests.py`
- **Auto** `src/medical/migrations/0001_initial.py` (generate via manage.py)
- **Modify** `src/dental/settings.py` — добавить `'medical'` в INSTALLED_APPS, MEDIA_URL, MEDIA_ROOT
- **Modify** `src/dental/urls.py` — раздача media в DEBUG
- **Modify** `src/api/urls.py` — подключить `medical.urls`
- **Modify** `docker-compose.yml` — volume `media_files`

### Frontend
- **Create** `frontend/src/api/medical.ts`
- **Create** `frontend/src/api/files.ts`
- **Modify** `frontend/src/api/patients.ts` — добавить `getPatient(id)`
- **Modify** `frontend/src/App.tsx` — добавить маршруты пациента
- **Modify** `frontend/src/pages/admin/Patients.tsx` — строки кликабельны
- **Create** `frontend/src/pages/admin/PatientCard.tsx`
- **Create** `frontend/src/pages/admin/PatientCard.module.css`
- **Create** `frontend/src/components/ToothFormula/ToothFormula.tsx`
- **Create** `frontend/src/components/ToothFormula/ToothFormula.module.css`
- **Create** `frontend/src/components/ToothFormula/ToothSidebar.tsx`
- **Create** `frontend/src/components/ToothFormula/ToothSidebar.module.css`
- **Create** `frontend/src/components/TreatmentPlan/TreatmentPlan.tsx`
- **Create** `frontend/src/components/TreatmentPlan/TreatmentPlan.module.css`
- **Create** `frontend/src/pages/admin/PatientFiles.tsx`
- **Create** `frontend/src/pages/admin/PatientFiles.module.css`

---

## Task 1: `medical` app — модели и миграция

**Files:**
- Create: `src/medical/__init__.py`
- Create: `src/medical/apps.py`
- Create: `src/medical/models.py`
- Create: `src/medical/admin.py`
- Auto: `src/medical/migrations/0001_initial.py`

- [ ] **Step 1: Создать скелет приложения**

```python
# src/medical/__init__.py
# (пустой файл)
```

```python
# src/medical/apps.py
from django.apps import AppConfig

class MedicalConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'medical'
    verbose_name = 'Медкарта'
```

- [ ] **Step 2: Написать модели**

```python
# src/medical/models.py
from django.db import models
from django.conf import settings
from client.models import Client
from doctors.models import Service


def patient_file_path(instance, filename):
    from datetime import date
    today = date.today()
    return f'patients/{instance.patient_id}/{today.year}/{today.month}/{filename}'


class MedicalNote(models.Model):
    patient = models.OneToOneField(Client, on_delete=models.CASCADE, related_name='medical_note')
    anamnesis = models.TextField(blank=True, default='')
    allergies = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='+'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Медицинская заметка'
        verbose_name_plural = 'Медицинские заметки'


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
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('patient', 'tooth_number')]
        verbose_name = 'Статус зуба'
        verbose_name_plural = 'Статусы зубов'


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

    class Meta:
        verbose_name = 'Пункт плана лечения'
        verbose_name_plural = 'Пункты плана лечения'
        ordering = ['-created_at']


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
```

- [ ] **Step 3: Зарегистрировать в settings**

В `src/dental/settings.py` в блок `INSTALLED_APPS` добавить `'medical'` после `'records'`:

```python
    # Local
    'client',
    'users',
    'doctors',
    'records',
    'medical',   # ← добавить
    'api',
```

В конец файла добавить:

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

- [ ] **Step 4: Создать admin.py**

```python
# src/medical/admin.py
from django.contrib import admin
from .models import MedicalNote, ToothRecord, TreatmentPlanItem, PatientFile

admin.site.register(MedicalNote)
admin.site.register(ToothRecord)
admin.site.register(TreatmentPlanItem)
admin.site.register(PatientFile)
```

- [ ] **Step 5: Создать пустой migrations/__init__.py и сгенерировать миграцию**

```python
# src/medical/migrations/__init__.py
# (пустой файл)
```

Запустить:
```bash
docker exec dental_crm-backend-1 bash -c "cd /DENTAL_CRM/src && python manage.py makemigrations medical"
```

Ожидаемый вывод: `Migrations for 'medical': medical/migrations/0001_initial.py`

- [ ] **Step 6: Применить миграцию**

```bash
docker exec dental_crm-backend-1 bash -c "cd /DENTAL_CRM/src && python manage.py migrate"
```

Ожидаемый вывод: `Applying medical.0001_initial... OK`

- [ ] **Step 7: Commit**

```bash
git add src/medical/ src/dental/settings.py
git commit -m "feat(medical): add medical app with 4 models and migration"
```

---

## Task 2: Подключить URLs, media-раздача, docker volume

**Files:**
- Modify: `src/dental/urls.py`
- Modify: `src/api/urls.py`
- Create: `src/medical/urls.py` (скелет)
- Modify: `docker-compose.yml`

- [ ] **Step 1: Создать скелет URLs**

```python
# src/medical/urls.py
from django.urls import path
from . import views

urlpatterns = []
```

- [ ] **Step 2: Подключить к api/urls.py**

Файл `src/api/urls.py` — добавить строку:

```python
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.jwt import CustomTokenObtainPairView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include('doctors.urls')),
    path('', include('client.urls')),
    path('', include('records.urls')),
    path('', include('medical.urls')),
]
```

- [ ] **Step 3: Раздача media в dental/urls.py**

```python
# src/dental/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

- [ ] **Step 4: Добавить media volume в docker-compose.yml**

```yaml
version: '3.9'

services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_DB: dental_base
      POSTGRES_USER: dental
      POSTGRES_PASSWORD: dental123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: .
    command: >
      bash -c "cd /DENTAL_CRM/src &&
               python manage.py migrate &&
               python manage.py runserver 0.0.0.0:8000"
    volumes:
      - .:/DENTAL_CRM
      - media_files:/DENTAL_CRM/src/media
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=db
    depends_on:
      - db
    restart: on-failure

  frontend:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: sh -c "npm install && npm run dev -- --host"
    ports:
      - "5173:5173"
    environment:
      - VITE_BACKEND_URL=http://backend:8000
    depends_on:
      - backend
    restart: on-failure

volumes:
  postgres_data:
  media_files:
```

- [ ] **Step 5: Проверить, что сервер стартует без ошибок**

```bash
docker exec dental_crm-backend-1 bash -c "cd /DENTAL_CRM/src && python manage.py check"
```

Ожидаемый вывод: `System check identified no issues (0 silenced).`

- [ ] **Step 6: Commit**

```bash
git add src/api/urls.py src/medical/urls.py src/dental/urls.py docker-compose.yml
git commit -m "feat(medical): wire medical URLs, media serving, docker volume"
```

---

## Task 3: MedicalNote + ToothRecord API + тесты

**Files:**
- Create: `src/medical/tests.py`
- Create: `src/medical/serializers.py`
- Modify: `src/medical/views.py`
- Modify: `src/medical/urls.py`

- [ ] **Step 1: Написать failing тесты**

```python
# src/medical/tests.py
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from doctors.models import Doctors, Service, Specialization
from client.models import Client, Gender, FindOut
from .models import MedicalNote, ToothRecord


class MedicalTestBase(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@test.kz', password='pass', role='admin',
            first_name='Admin', last_name='Test'
        )
        self.doctor_user = User.objects.create_user(
            email='doc@test.kz', password='pass', role='doctor',
            first_name='Доктор', last_name='Тестов'
        )
        spec = Specialization.objects.create(title='Терапевт', cost=5000)
        svc = Service.objects.create(title='Осмотр', spec_id=spec)
        self.doctor = Doctors.objects.create(
            user=self.doctor_user,
            first_name='Доктор', last_name='Тестов', father_name='Тестович',
            services_id=svc
        )
        gender = Gender.objects.create(gender_name='Мужской')
        find_out = FindOut.objects.create(find_out_name='Интернет')
        self.patient = Client.objects.create(
            first_name='Иван', last_name='Петров', father_name='Иванович',
            gender=gender, find_out=find_out, doctor=self.doctor
        )
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)
        self.doctor_client = APIClient()
        self.doctor_client.force_authenticate(user=self.doctor_user)


class MedicalNoteAPITest(MedicalTestBase):
    def test_admin_get_note_creates_if_missing(self):
        url = f'/api/v1/medical/{self.patient.id}/note/'
        res = self.admin_client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('anamnesis', res.data)
        self.assertEqual(MedicalNote.objects.count(), 1)

    def test_admin_put_note_saves(self):
        url = f'/api/v1/medical/{self.patient.id}/note/'
        res = self.admin_client.put(url, {'anamnesis': 'Аллергия на пенициллин'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        note = MedicalNote.objects.get(patient=self.patient)
        self.assertEqual(note.anamnesis, 'Аллергия на пенициллин')

    def test_doctor_own_patient_get_note(self):
        url = f'/api/v1/medical/{self.patient.id}/note/'
        res = self.doctor_client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_doctor_other_patient_gets_403(self):
        gender = Gender.objects.create(gender_name='Женский')
        find_out = FindOut.objects.create(find_out_name='Реклама')
        other_doctor_user = User.objects.create_user(
            email='otherdoc@test.kz', password='pass', role='doctor',
            first_name='Другой', last_name='Врач'
        )
        spec = Specialization.objects.create(title='Хирург', cost=8000)
        svc = Service.objects.create(title='Удаление', spec_id=spec)
        other_doctor = Doctors.objects.create(
            user=other_doctor_user,
            first_name='Другой', last_name='Врач', father_name='Врачович',
            services_id=svc
        )
        other_patient = Client.objects.create(
            first_name='Другой', last_name='Пациент', father_name='Пациентов',
            gender=gender, find_out=find_out, doctor=other_doctor
        )
        other_doctor_client = APIClient()
        other_doctor_client.force_authenticate(user=other_doctor_user)
        url = f'/api/v1/medical/{other_patient.id}/note/'
        res = self.doctor_client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class ToothRecordAPITest(MedicalTestBase):
    def test_admin_get_teeth_returns_list(self):
        url = f'/api/v1/medical/{self.patient.id}/teeth/'
        res = self.admin_client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res.data, list)

    def test_put_tooth_creates_record(self):
        url = f'/api/v1/medical/{self.patient.id}/teeth/36/'
        res = self.admin_client.put(url, {'status': 'urgent', 'notes': 'Глубокий кариес'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(ToothRecord.objects.filter(patient=self.patient, tooth_number='36').count(), 1)
        self.assertEqual(res.data['status'], 'urgent')

    def test_put_same_tooth_updates_not_duplicates(self):
        url = f'/api/v1/medical/{self.patient.id}/teeth/36/'
        self.admin_client.put(url, {'status': 'urgent'}, format='json')
        self.admin_client.put(url, {'status': 'treated'}, format='json')
        self.assertEqual(ToothRecord.objects.filter(patient=self.patient, tooth_number='36').count(), 1)
        tooth = ToothRecord.objects.get(patient=self.patient, tooth_number='36')
        self.assertEqual(tooth.status, 'treated')
```

- [ ] **Step 2: Запустить тесты — убедиться, что падают**

```bash
docker exec dental_crm-backend-1 bash -c "cd /DENTAL_CRM/src && python manage.py test medical -v 2"
```

Ожидаемый вывод: `ERROR` — 404 или `AttributeError` (URL ещё не существует).

- [ ] **Step 3: Написать сериализаторы**

```python
# src/medical/serializers.py
from rest_framework import serializers
from .models import MedicalNote, ToothRecord, TreatmentPlanItem, PatientFile


class MedicalNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalNote
        fields = ['anamnesis', 'allergies', 'notes', 'updated_at', 'updated_by']
        read_only_fields = ['updated_at', 'updated_by']


class ToothRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToothRecord
        fields = ['tooth_number', 'tooth_type', 'status', 'notes', 'updated_at', 'updated_by']
        read_only_fields = ['updated_at', 'updated_by']


class TreatmentPlanItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentPlanItem
        fields = [
            'id', 'tooth_number', 'diagnosis', 'treatment', 'service',
            'due_date', 'status', 'postpone_reason', 'linked_record',
            'doctor', 'created_at',
        ]
        read_only_fields = ['doctor', 'created_at']


class PatientFileSerializer(serializers.ModelSerializer):
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'pdf', 'dcm'}

    def validate_file(self, value):
        ext = value.name.rsplit('.', 1)[-1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f'Недопустимый формат. Разрешены: {", ".join(self.ALLOWED_EXTENSIONS)}'
            )
        if value.size > 20 * 1024 * 1024:
            raise serializers.ValidationError('Размер файла превышает 20 МБ.')
        return value

    class Meta:
        model = PatientFile
        fields = [
            'id', 'file', 'file_type', 'description',
            'tooth_number', 'linked_record', 'uploaded_by', 'uploaded_at',
        ]
        read_only_fields = ['uploaded_by', 'uploaded_at']
```

- [ ] **Step 4: Написать views (Note + Teeth)**

```python
# src/medical/views.py
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from api.permissions import IsAdminOrDoctor
from client.models import Client
from records.models import Record
from .models import MedicalNote, ToothRecord, TreatmentPlanItem, PatientFile
from .serializers import (
    MedicalNoteSerializer, ToothRecordSerializer,
    TreatmentPlanItemSerializer, PatientFileSerializer,
)


class ClientAccessMixin:
    def get_client(self):
        client_id = self.kwargs['client_id']
        client = get_object_or_404(Client, pk=client_id)
        user = self.request.user
        if user.role == 'admin':
            return client
        if user.role == 'doctor':
            try:
                doctor = user.doctors_profile
            except Exception:
                raise PermissionDenied
            if (client.doctor == doctor or
                    Record.objects.filter(doctor=doctor, client=client).exists()):
                return client
        raise PermissionDenied


class MedicalNoteView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, client_id):
        client = self.get_client()
        note, _ = MedicalNote.objects.get_or_create(
            patient=client, defaults={'updated_by': request.user}
        )
        return Response(MedicalNoteSerializer(note).data)

    def put(self, request, client_id):
        client = self.get_client()
        note, _ = MedicalNote.objects.get_or_create(
            patient=client, defaults={'updated_by': request.user}
        )
        serializer = MedicalNoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)


class TeethListView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, client_id):
        client = self.get_client()
        teeth = ToothRecord.objects.filter(patient=client)
        return Response(ToothRecordSerializer(teeth, many=True).data)


class ToothDetailView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def put(self, request, client_id, tooth_number):
        client = self.get_client()
        tooth, _ = ToothRecord.objects.get_or_create(
            patient=client,
            tooth_number=tooth_number,
            defaults={'updated_by': request.user},
        )
        serializer = ToothRecordSerializer(tooth, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)


class PlanListView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, client_id):
        client = self.get_client()
        plan = TreatmentPlanItem.objects.filter(patient=client)
        return Response(TreatmentPlanItemSerializer(plan, many=True).data)

    def post(self, request, client_id):
        client = self.get_client()
        serializer = TreatmentPlanItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(patient=client, doctor=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PlanDetailView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def patch(self, request, client_id, pk):
        client = self.get_client()
        item = get_object_or_404(TreatmentPlanItem, pk=pk, patient=client)
        serializer = TreatmentPlanItemSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        if instance.status == 'done':
            ToothRecord.objects.update_or_create(
                patient=client,
                tooth_number=instance.tooth_number,
                defaults={'status': 'treated', 'updated_by': request.user},
            )
        return Response(serializer.data)

    def delete(self, request, client_id, pk):
        client = self.get_client()
        item = get_object_or_404(TreatmentPlanItem, pk=pk, patient=client)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FilesListView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, client_id):
        client = self.get_client()
        files = PatientFile.objects.filter(patient=client)
        return Response(PatientFileSerializer(files, many=True, context={'request': request}).data)

    def post(self, request, client_id):
        client = self.get_client()
        serializer = PatientFileSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(patient=client, uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FileDetailView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, client_id, pk):
        client = self.get_client()
        file = get_object_or_404(PatientFile, pk=pk, patient=client)
        return Response(PatientFileSerializer(file, context={'request': request}).data)

    def delete(self, request, client_id, pk):
        client = self.get_client()
        file = get_object_or_404(PatientFile, pk=pk, patient=client)
        file.file.delete(save=False)
        file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 5: Заполнить urls.py**

```python
# src/medical/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('medical/<int:client_id>/note/', views.MedicalNoteView.as_view()),
    path('medical/<int:client_id>/teeth/', views.TeethListView.as_view()),
    path('medical/<int:client_id>/teeth/<str:tooth_number>/', views.ToothDetailView.as_view()),
    path('medical/<int:client_id>/plan/', views.PlanListView.as_view()),
    path('medical/<int:client_id>/plan/<int:pk>/', views.PlanDetailView.as_view()),
    path('medical/<int:client_id>/files/', views.FilesListView.as_view()),
    path('medical/<int:client_id>/files/<int:pk>/', views.FileDetailView.as_view()),
]
```

- [ ] **Step 6: Запустить тесты — убедиться, что проходят**

```bash
docker exec dental_crm-backend-1 bash -c "cd /DENTAL_CRM/src && python manage.py test medical.tests.MedicalNoteAPITest medical.tests.ToothRecordAPITest -v 2"
```

Ожидаемый вывод: все тесты `OK`.

- [ ] **Step 7: Commit**

```bash
git add src/medical/
git commit -m "feat(medical): add MedicalNote + ToothRecord API with tests"
```

---

## Task 4: TreatmentPlanItem API + тесты

**Files:**
- Modify: `src/medical/tests.py`

Вью и сериализаторы уже написаны в Task 3 — добавляем только тесты.

- [ ] **Step 1: Добавить тесты плана лечения в конец tests.py**

```python
# Добавить в src/medical/tests.py

from records.models import Record, Status, RecordingType, Specialization as RecSpec
from .models import TreatmentPlanItem


class TreatmentPlanAPITest(MedicalTestBase):
    def test_admin_post_plan_item(self):
        url = f'/api/v1/medical/{self.patient.id}/plan/'
        data = {
            'tooth_number': '36',
            'diagnosis': 'Кариес средний',
            'treatment': 'Пломба композитная',
        }
        res = self.admin_client.post(url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TreatmentPlanItem.objects.count(), 1)
        self.assertEqual(res.data['status'], 'planned')

    def test_admin_get_plan_list(self):
        TreatmentPlanItem.objects.create(
            patient=self.patient, tooth_number='36',
            diagnosis='Кариес', treatment='Пломба',
            doctor=self.admin,
        )
        url = f'/api/v1/medical/{self.patient.id}/plan/'
        res = self.admin_client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_patch_status_done_updates_tooth(self):
        item = TreatmentPlanItem.objects.create(
            patient=self.patient, tooth_number='16',
            diagnosis='Пульпит', treatment='Депульпирование',
            doctor=self.admin,
        )
        url = f'/api/v1/medical/{self.patient.id}/plan/{item.id}/'
        res = self.admin_client.patch(url, {'status': 'done'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        tooth = ToothRecord.objects.get(patient=self.patient, tooth_number='16')
        self.assertEqual(tooth.status, 'treated')

    def test_patch_status_postponed_saves_reason(self):
        item = TreatmentPlanItem.objects.create(
            patient=self.patient, tooth_number='46',
            diagnosis='Кариес', treatment='Пломба',
            doctor=self.admin,
        )
        url = f'/api/v1/medical/{self.patient.id}/plan/{item.id}/'
        res = self.admin_client.patch(
            url, {'status': 'postponed', 'postpone_reason': 'Пациент уехал'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.postpone_reason, 'Пациент уехал')

    def test_delete_plan_item(self):
        item = TreatmentPlanItem.objects.create(
            patient=self.patient, tooth_number='26',
            diagnosis='Кариес', treatment='Пломба',
            doctor=self.admin,
        )
        url = f'/api/v1/medical/{self.patient.id}/plan/{item.id}/'
        res = self.admin_client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(TreatmentPlanItem.objects.count(), 0)
```

- [ ] **Step 2: Запустить тесты**

```bash
docker exec dental_crm-backend-1 bash -c "cd /DENTAL_CRM/src && python manage.py test medical.tests.TreatmentPlanAPITest -v 2"
```

Ожидаемый вывод: все тесты `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/medical/tests.py
git commit -m "test(medical): add TreatmentPlanItem API tests"
```

---

## Task 5: PatientFile API + тесты

**Files:**
- Modify: `src/medical/tests.py`

Вью и сериализатор уже написаны.

- [ ] **Step 1: Добавить тесты файлов в конец tests.py**

```python
# Добавить в src/medical/tests.py

import os
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import PatientFile


class PatientFileAPITest(MedicalTestBase):
    def test_upload_file_success(self):
        url = f'/api/v1/medical/{self.patient.id}/files/'
        small_file = SimpleUploadedFile('xray.jpg', b'fake-image-data', content_type='image/jpeg')
        data = {'file': small_file, 'file_type': 'xray', 'description': 'Верхняя челюсть'}
        res = self.admin_client.post(url, data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PatientFile.objects.count(), 1)

    def test_upload_file_wrong_extension_rejected(self):
        url = f'/api/v1/medical/{self.patient.id}/files/'
        bad_file = SimpleUploadedFile('virus.exe', b'MZ', content_type='application/octet-stream')
        data = {'file': bad_file, 'file_type': 'other'}
        res = self.admin_client.post(url, data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_file_too_large_rejected(self):
        url = f'/api/v1/medical/{self.patient.id}/files/'
        large_content = b'x' * (21 * 1024 * 1024)
        large_file = SimpleUploadedFile('big.jpg', large_content, content_type='image/jpeg')
        data = {'file': large_file, 'file_type': 'photo'}
        res = self.admin_client.post(url, data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_files_list(self):
        small_file = SimpleUploadedFile('xray.jpg', b'data', content_type='image/jpeg')
        PatientFile.objects.create(
            patient=self.patient, file=small_file,
            file_type='xray', uploaded_by=self.admin,
        )
        url = f'/api/v1/medical/{self.patient.id}/files/'
        res = self.admin_client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_delete_file_removes_record(self):
        small_file = SimpleUploadedFile('xray.jpg', b'data', content_type='image/jpeg')
        pf = PatientFile.objects.create(
            patient=self.patient, file=small_file,
            file_type='xray', uploaded_by=self.admin,
        )
        url = f'/api/v1/medical/{self.patient.id}/files/{pf.id}/'
        res = self.admin_client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(PatientFile.objects.count(), 0)
```

- [ ] **Step 2: Запустить тесты**

```bash
docker exec dental_crm-backend-1 bash -c "cd /DENTAL_CRM/src && python manage.py test medical.tests.PatientFileAPITest -v 2"
```

Ожидаемый вывод: все тесты `OK`.

- [ ] **Step 3: Запустить полный набор тестов medical**

```bash
docker exec dental_crm-backend-1 bash -c "cd /DENTAL_CRM/src && python manage.py test medical -v 2"
```

Ожидаемый вывод: все тесты `OK` (8+ тестов).

- [ ] **Step 4: Commit**

```bash
git add src/medical/tests.py
git commit -m "test(medical): add PatientFile upload/delete API tests"
```

---

## Task 6: Frontend API layer

**Files:**
- Create: `frontend/src/api/medical.ts`
- Create: `frontend/src/api/files.ts`
- Modify: `frontend/src/api/patients.ts`

- [ ] **Step 1: Создать medical.ts**

```typescript
// frontend/src/api/medical.ts
import api from './client'

export interface MedicalNote {
  anamnesis: string
  allergies: string
  notes: string
  updated_at: string
  updated_by: number | null
}

export interface ToothRecord {
  tooth_number: string
  tooth_type: 'permanent' | 'primary'
  status: 'healthy' | 'treated' | 'urgent' | 'observation' | 'missing'
  notes: string
  updated_at: string
  updated_by: number | null
}

export interface TreatmentPlanItem {
  id: number
  tooth_number: string
  diagnosis: string
  treatment: string
  service: number | null
  due_date: string | null
  status: 'planned' | 'in_progress' | 'done' | 'postponed'
  postpone_reason: string
  linked_record: number | null
  doctor: number
  created_at: string
}

export type NewPlanItem = Pick<TreatmentPlanItem, 'tooth_number' | 'diagnosis' | 'treatment'> &
  Partial<Pick<TreatmentPlanItem, 'service' | 'due_date'>>

export const getNote = (clientId: number) =>
  api.get<MedicalNote>(`/medical/${clientId}/note/`).then(r => r.data)

export const saveNote = (clientId: number, data: Partial<MedicalNote>) =>
  api.put<MedicalNote>(`/medical/${clientId}/note/`, data).then(r => r.data)

export const getTeeth = (clientId: number) =>
  api.get<ToothRecord[]>(`/medical/${clientId}/teeth/`).then(r => r.data)

export const updateTooth = (clientId: number, toothNumber: string, data: Partial<ToothRecord>) =>
  api.put<ToothRecord>(`/medical/${clientId}/teeth/${toothNumber}/`, data).then(r => r.data)

export const getPlan = (clientId: number) =>
  api.get<TreatmentPlanItem[]>(`/medical/${clientId}/plan/`).then(r => r.data)

export const addPlanItem = (clientId: number, data: NewPlanItem) =>
  api.post<TreatmentPlanItem>(`/medical/${clientId}/plan/`, data).then(r => r.data)

export const updatePlanItem = (clientId: number, itemId: number, data: Partial<TreatmentPlanItem>) =>
  api.patch<TreatmentPlanItem>(`/medical/${clientId}/plan/${itemId}/`, data).then(r => r.data)

export const deletePlanItem = (clientId: number, itemId: number) =>
  api.delete(`/medical/${clientId}/plan/${itemId}/`)
```

- [ ] **Step 2: Создать files.ts**

```typescript
// frontend/src/api/files.ts
import api from './client'

export interface PatientFile {
  id: number
  file: string
  file_type: 'xray' | 'photo' | 'document' | 'other'
  description: string
  tooth_number: string | null
  linked_record: number | null
  uploaded_by: number | null
  uploaded_at: string
}

export const getFiles = (clientId: number) =>
  api.get<PatientFile[]>(`/medical/${clientId}/files/`).then(r => r.data)

export const uploadFile = (clientId: number, formData: FormData) =>
  api.post<PatientFile>(`/medical/${clientId}/files/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

export const deleteFile = (clientId: number, fileId: number) =>
  api.delete(`/medical/${clientId}/files/${fileId}/`)
```

- [ ] **Step 3: Добавить getPatient в patients.ts**

В конец `frontend/src/api/patients.ts` добавить:

```typescript
export const getPatient = (id: number) =>
  api.get<Patient>(`/clients/${id}/`).then(r => r.data)
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/medical.ts frontend/src/api/files.ts frontend/src/api/patients.ts
git commit -m "feat(frontend): add medical, files API layer + getPatient"
```

---

## Task 7: Routing + кликабельные строки пациентов

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/admin/Patients.tsx`

- [ ] **Step 1: Добавить маршруты в App.tsx**

Найти блок с `<Route path="patients"` и добавить дочерние маршруты:

```tsx
// frontend/src/App.tsx
// Заменить:
//   <Route path="patients" element={<Patients />} />
// На:

import PatientCard from './pages/admin/PatientCard'

// ...внутри <Route path="/admin">:
<Route path="patients" element={<Patients />} />
<Route path="patients/:id" element={<PatientCard />} />
<Route path="patients/:id/files" element={<PatientCard defaultTab="files" />} />
```

Полный итоговый App.tsx:

```tsx
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import AdminLayout from './pages/admin/Layout'
import Schedule from './pages/admin/Schedule'
import Patients from './pages/admin/Patients'
import PatientCard from './pages/admin/PatientCard'
import NewRecord from './pages/admin/NewRecord'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin', 'doctor']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientCard />} />
            <Route path="patients/:id/files" element={<PatientCard defaultTab="files" />} />
            <Route path="records/new" element={<NewRecord />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin/schedule" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
```

- [ ] **Step 2: Сделать строки таблицы кликабельными в Patients.tsx**

Найти `<tr>` внутри `<tbody>` и добавить `onClick` + `cursor: pointer`:

```tsx
// В frontend/src/pages/admin/Patients.tsx
// Добавить импорт:
import { useNavigate } from 'react-router-dom'

// Внутри компонента:
const navigate = useNavigate()

// Найти <tr> в tbody и заменить на:
<tr
  key={p.id}
  className={styles.row}
  onClick={() => navigate(`/admin/patients/${p.id}`)}
  style={{ cursor: 'pointer' }}
>
```

Добавить в `Patients.module.css`:

```css
.row:hover {
  background: #f5f5f5;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx frontend/src/pages/admin/Patients.tsx frontend/src/pages/admin/Patients.module.css
git commit -m "feat(frontend): add patient card routes, clickable patient rows"
```

---

## Task 8: PatientCard — страница с 3 вкладками

**Files:**
- Create: `frontend/src/pages/admin/PatientCard.tsx`
- Create: `frontend/src/pages/admin/PatientCard.module.css`

- [ ] **Step 1: Создать PatientCard.module.css**

```css
/* frontend/src/pages/admin/PatientCard.module.css */
.page {
  padding: 24px;
  max-width: 1200px;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #1677ff;
  padding: 0;
}

.name {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 24px;
}

.tab {
  padding: 10px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  font-size: 15px;
  color: #595959;
  transition: color 0.2s, border-color 0.2s;
}

.tab:hover {
  color: #1677ff;
}

.tabActive {
  composes: tab;
  color: #1677ff;
  border-bottom-color: #1677ff;
  font-weight: 600;
}

.infoGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 32px;
  max-width: 600px;
  margin-bottom: 32px;
}

.infoLabel {
  color: #8c8c8c;
  font-size: 13px;
  margin: 0;
}

.infoValue {
  font-size: 15px;
  margin: 0;
}

.sectionTitle {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
}

.visitsTable {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.visitsTable th,
.visitsTable td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.visitsTable th {
  color: #8c8c8c;
  font-weight: 500;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #8c8c8c;
}
```

- [ ] **Step 2: Создать PatientCard.tsx**

```tsx
// frontend/src/pages/admin/PatientCard.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPatient } from '../../api/patients'
import { getRecords } from '../../api/records'
import ToothFormula from '../../components/ToothFormula/ToothFormula'
import TreatmentPlan from '../../components/TreatmentPlan/TreatmentPlan'
import PatientFiles from './PatientFiles'
import styles from './PatientCard.module.css'

type Tab = 'info' | 'medical' | 'files'

interface Props {
  defaultTab?: Tab
}

export default function PatientCard({ defaultTab = 'info' }: Props) {
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>(defaultTab)

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', clientId],
    queryFn: () => getPatient(clientId),
  })

  const { data: records = [] } = useQuery({
    queryKey: ['records', { client: clientId }],
    queryFn: () => getRecords({ client_id: clientId }),
    enabled: tab === 'info',
  })

  if (isLoading || !patient) {
    return <div className={styles.loading}>Загрузка...</div>
  }

  const fullName = `${patient.last_name} ${patient.first_name} ${patient.father_name}`

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/admin/patients')}>←</button>
        <h1 className={styles.name}>{fullName}</h1>
      </div>

      <div className={styles.tabs}>
        <button className={tab === 'info' ? styles.tabActive : styles.tab} onClick={() => setTab('info')}>
          Информация
        </button>
        <button className={tab === 'medical' ? styles.tabActive : styles.tab} onClick={() => setTab('medical')}>
          Медкарта
        </button>
        <button className={tab === 'files' ? styles.tabActive : styles.tab} onClick={() => setTab('files')}>
          Файлы
        </button>
      </div>

      {tab === 'info' && (
        <div>
          <div className={styles.infoGrid}>
            <p className={styles.infoLabel}>Телефон</p>
            <p className={styles.infoValue}>{patient.mobile_phone ?? '—'}</p>
            <p className={styles.infoLabel}>ИИН</p>
            <p className={styles.infoValue}>{patient.iin ?? '—'}</p>
            <p className={styles.infoLabel}>Дата рождения</p>
            <p className={styles.infoValue}>{patient.date_of_birth ?? '—'}</p>
            <p className={styles.infoLabel}>Как узнал</p>
            <p className={styles.infoValue}>{patient.find_out?.find_out_name ?? '—'}</p>
          </div>

          <p className={styles.sectionTitle}>История визитов</p>
          <table className={styles.visitsTable}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Врач</th>
                <th>Услуга</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 10).map(r => (
                <tr key={r.id}>
                  <td>{r.reception_day}</td>
                  <td>{r.doctors_name}</td>
                  <td>{r.service ?? '—'}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={4} style={{ color: '#8c8c8c' }}>Визитов нет</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'medical' && (
        <div>
          <ToothFormula clientId={clientId} />
          <TreatmentPlan clientId={clientId} />
        </div>
      )}

      {tab === 'files' && <PatientFiles clientId={clientId} />}
    </div>
  )
}
```

Примечание: `getRecords` нужно расширить — добавить фильтр по `client_id`. Добавить параметр в `frontend/src/api/records.ts`:

```typescript
// В существующей функции getRecords — добавить client_id в params:
export const getRecords = (params: { date?: string; client_id?: number } = {}) =>
  api.get<AppointmentRecord[]>('/records/', { params }).then(r => r.data)
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/PatientCard.tsx frontend/src/pages/admin/PatientCard.module.css frontend/src/api/records.ts
git commit -m "feat(frontend): add PatientCard page with 3 tabs"
```

---

## Task 9: ToothFormula SVG компонент + боковая панель

**Files:**
- Create: `frontend/src/components/ToothFormula/ToothFormula.tsx`
- Create: `frontend/src/components/ToothFormula/ToothFormula.module.css`
- Create: `frontend/src/components/ToothFormula/ToothSidebar.tsx`
- Create: `frontend/src/components/ToothFormula/ToothSidebar.module.css`

- [ ] **Step 1: Создать ToothFormula.module.css**

```css
/* frontend/src/components/ToothFormula/ToothFormula.module.css */
.wrapper {
  margin-bottom: 32px;
}

.switcher {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.switchBtn {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #595959;
}

.switchBtnActive {
  composes: switchBtn;
  border-color: #1677ff;
  color: #1677ff;
  background: #e6f4ff;
}

.svgWrap {
  overflow-x: auto;
}

.legend {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #595959;
}

.legendDot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 100;
}
```

- [ ] **Step 2: Создать ToothFormula.tsx**

```tsx
// frontend/src/components/ToothFormula/ToothFormula.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getTeeth, ToothRecord } from '../../api/medical'
import ToothSidebar from './ToothSidebar'
import styles from './ToothFormula.module.css'

type TeethType = 'permanent' | 'primary'

const ADULT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const ADULT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
const PRIMARY_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65]
const PRIMARY_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]

const STATUS_COLORS: Record<string, string> = {
  healthy: '#52c41a',
  treated: '#1677ff',
  urgent: '#ff4d4f',
  observation: '#faad14',
  missing: '#d9d9d9',
}

const STATUS_LABELS: Record<string, string> = {
  healthy: 'Здоров',
  treated: 'Пролечен',
  urgent: 'Срочно',
  observation: 'Наблюдение',
  missing: 'Отсутствует',
}

const TW = 32
const TH = 40
const GAP = 4
const MID_GAP = 14
const ROW_GAP = 20
const LABEL_H = 18

function buildRow(teeth: number[], y: number, statusMap: Map<string, string>, onClick: (n: string) => void) {
  const mid = teeth.length / 2
  return teeth.map((num, i) => {
    const x = i < mid ? i * (TW + GAP) : i * (TW + GAP) + MID_GAP
    const tooth = String(num)
    const color = STATUS_COLORS[statusMap.get(tooth) ?? 'healthy']
    return (
      <g key={num} transform={`translate(${x},${y})`} onClick={() => onClick(tooth)} style={{ cursor: 'pointer' }}>
        <rect width={TW} height={TH} rx={5} fill={color} stroke="#fff" strokeWidth={1.5} />
        <text
          x={TW / 2} y={TH / 2 + 4}
          textAnchor="middle" fontSize={10} fill="#fff" fontWeight="600"
          style={{ userSelect: 'none' }}
        >
          {num}
        </text>
      </g>
    )
  })
}

interface Props {
  clientId: number
}

export default function ToothFormula({ clientId }: Props) {
  const qc = useQueryClient()
  const [teethType, setTeethType] = useState<TeethType>('permanent')
  const [selected, setSelected] = useState<string | null>(null)

  const { data: teeth = [] } = useQuery({
    queryKey: ['teeth', clientId],
    queryFn: () => getTeeth(clientId),
  })

  const statusMap = new Map<string, string>(teeth.map(t => [t.tooth_number, t.status]))
  const recordMap = new Map<string, ToothRecord>(teeth.map(t => [t.tooth_number, t]))

  const upper = teethType === 'permanent' ? ADULT_UPPER : PRIMARY_UPPER
  const lower = teethType === 'permanent' ? ADULT_LOWER : PRIMARY_LOWER
  const halfCount = upper.length / 2
  const svgWidth = upper.length * (TW + GAP) + MID_GAP + TW
  const upperY = LABEL_H
  const lowerY = LABEL_H + TH + ROW_GAP

  return (
    <div className={styles.wrapper}>
      <div className={styles.switcher}>
        <button
          className={teethType === 'permanent' ? styles.switchBtnActive : styles.switchBtn}
          onClick={() => setTeethType('permanent')}
        >
          Взрослые зубы
        </button>
        <button
          className={teethType === 'primary' ? styles.switchBtnActive : styles.switchBtn}
          onClick={() => setTeethType('primary')}
        >
          Молочные зубы
        </button>
      </div>

      <div className={styles.svgWrap}>
        <svg width={svgWidth} height={lowerY + TH + LABEL_H} style={{ display: 'block' }}>
          {/* Верхний ряд */}
          <text x={halfCount * (TW + GAP) - 2} y={LABEL_H - 4} textAnchor="end" fontSize={10} fill="#aaa">↑ Верхняя</text>
          {buildRow(upper, upperY, statusMap, setSelected)}
          {/* Нижний ряд */}
          {buildRow(lower, lowerY, statusMap, setSelected)}
          <text x={halfCount * (TW + GAP) - 2} y={lowerY + TH + LABEL_H - 2} textAnchor="end" fontSize={10} fill="#aaa">↓ Нижняя</text>
        </svg>
      </div>

      <div className={styles.legend}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: STATUS_COLORS[key] }} />
            {label}
          </div>
        ))}
      </div>

      {selected && (
        <>
          <div className={styles.overlay} onClick={() => setSelected(null)} />
          <ToothSidebar
            clientId={clientId}
            toothNumber={selected}
            record={recordMap.get(selected)}
            onClose={() => setSelected(null)}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ['teeth', clientId] })
              setSelected(null)
            }}
          />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Создать ToothSidebar.module.css**

```css
/* frontend/src/components/ToothFormula/ToothSidebar.module.css */
.sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 340px;
  height: 100vh;
  background: #fff;
  box-shadow: -4px 0 24px rgba(0,0,0,0.12);
  z-index: 101;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
}

.label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.select,
.textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.saveBtn {
  padding: 10px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.saveBtn:disabled {
  opacity: 0.6;
  cursor: default;
}

.planBtn {
  padding: 10px;
  background: #fff;
  color: #1677ff;
  border: 1px solid #1677ff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.planForm {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.addBtn {
  padding: 8px;
  background: #52c41a;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
```

- [ ] **Step 4: Создать ToothSidebar.tsx**

```tsx
// frontend/src/components/ToothFormula/ToothSidebar.tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTooth, addPlanItem, ToothRecord } from '../../api/medical'
import styles from './ToothSidebar.module.css'

const STATUS_OPTIONS = [
  { value: 'healthy', label: 'Здоров' },
  { value: 'treated', label: 'Пролечен' },
  { value: 'urgent', label: 'Срочно' },
  { value: 'observation', label: 'Наблюдение' },
  { value: 'missing', label: 'Отсутствует' },
]

const STATUS_COLORS: Record<string, string> = {
  healthy: '#52c41a',
  treated: '#1677ff',
  urgent: '#ff4d4f',
  observation: '#faad14',
  missing: '#d9d9d9',
}

interface Props {
  clientId: number
  toothNumber: string
  record: ToothRecord | undefined
  onClose: () => void
  onSaved: () => void
}

export default function ToothSidebar({ clientId, toothNumber, record, onClose, onSaved }: Props) {
  const [statusVal, setStatusVal] = useState(record?.status ?? 'healthy')
  const [notes, setNotes] = useState(record?.notes ?? '')
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')

  const qc = useQueryClient()

  const saveTooth = useMutation({
    mutationFn: () => updateTooth(clientId, toothNumber, { status: statusVal as ToothRecord['status'], notes }),
    onSuccess: onSaved,
  })

  const addPlan = useMutation({
    mutationFn: () => addPlanItem(clientId, { tooth_number: toothNumber, diagnosis, treatment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', clientId] })
      setShowPlanForm(false)
      setDiagnosis('')
      setTreatment('')
    },
  })

  return (
    <div className={styles.sidebar}>
      <p className={styles.title}>Зуб №{toothNumber}</p>

      <div>
        <span
          className={styles.badge}
          style={{ background: STATUS_COLORS[statusVal] ?? '#d9d9d9' }}
        >
          {STATUS_OPTIONS.find(o => o.value === statusVal)?.label ?? statusVal}
        </span>
      </div>

      <div>
        <p className={styles.label}>Изменить статус</p>
        <select className={styles.select} value={statusVal} onChange={e => setStatusVal(e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <p className={styles.label}>Комментарий</p>
        <textarea className={styles.textarea} value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className={styles.actions}>
        <button
          className={styles.saveBtn}
          disabled={saveTooth.isPending}
          onClick={() => saveTooth.mutate()}
        >
          {saveTooth.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button className={styles.planBtn} onClick={() => setShowPlanForm(v => !v)}>
          Добавить в план лечения
        </button>
      </div>

      {showPlanForm && (
        <div className={styles.planForm}>
          <div>
            <p className={styles.label}>Диагноз</p>
            <input className={styles.input} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
          </div>
          <div>
            <p className={styles.label}>Рекомендуемое лечение</p>
            <input className={styles.input} value={treatment} onChange={e => setTreatment(e.target.value)} />
          </div>
          <button
            className={styles.addBtn}
            disabled={!diagnosis || !treatment || addPlan.isPending}
            onClick={() => addPlan.mutate()}
          >
            {addPlan.isPending ? 'Добавление...' : 'Добавить в план'}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Ручная проверка**

Открыть `http://localhost:5173/admin/patients`, кликнуть на пациента → вкладка "Медкарта" → отображается SVG с зубами. Кликнуть на зуб → открывается боковая панель. Изменить статус → сохранить → цвет зуба меняется без перезагрузки.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ToothFormula/
git commit -m "feat(frontend): add ToothFormula SVG component with sidebar"
```

---

## Task 10: TreatmentPlan компонент

**Files:**
- Create: `frontend/src/components/TreatmentPlan/TreatmentPlan.tsx`
- Create: `frontend/src/components/TreatmentPlan/TreatmentPlan.module.css`

- [ ] **Step 1: Создать TreatmentPlan.module.css**

```css
/* frontend/src/components/TreatmentPlan/TreatmentPlan.module.css */
.section {
  margin-top: 32px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px;
}

.empty {
  color: #8c8c8c;
  font-size: 14px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.tooth {
  font-size: 12px;
  font-weight: 600;
  background: #e6f4ff;
  color: #1677ff;
  border-radius: 4px;
  padding: 2px 8px;
  white-space: nowrap;
}

.info {
  flex: 1;
  min-width: 0;
}

.diagnosis {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.treatment {
  font-size: 13px;
  color: #595959;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.due {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
}

.statusSelect {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  cursor: pointer;
}

.postponeInput {
  padding: 4px 8px;
  border: 1px solid #faad14;
  border-radius: 6px;
  font-size: 13px;
  width: 160px;
}

.deleteBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: #ff4d4f;
  font-size: 18px;
  padding: 0 4px;
  line-height: 1;
}

.deleteBtn:hover {
  opacity: 0.7;
}
```

- [ ] **Step 2: Создать TreatmentPlan.tsx**

```tsx
// frontend/src/components/TreatmentPlan/TreatmentPlan.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPlan, updatePlanItem, deletePlanItem, TreatmentPlanItem,
} from '../../api/medical'
import styles from './TreatmentPlan.module.css'

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Запланировано' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'done', label: 'Завершено' },
  { value: 'postponed', label: 'Отложено' },
]

interface Props {
  clientId: number
}

export default function TreatmentPlan({ clientId }: Props) {
  const qc = useQueryClient()

  const { data: plan = [] } = useQuery({
    queryKey: ['plan', clientId],
    queryFn: () => getPlan(clientId),
  })

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TreatmentPlanItem> }) =>
      updatePlanItem(clientId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', clientId] })
      qc.invalidateQueries({ queryKey: ['teeth', clientId] })
    },
  })

  const deleteItem = useMutation({
    mutationFn: (id: number) => deletePlanItem(clientId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan', clientId] }),
  })

  return (
    <div className={styles.section}>
      <p className={styles.title}>План лечения</p>

      {plan.length === 0 && (
        <p className={styles.empty}>Пункты плана отсутствуют. Кликните на зуб, чтобы добавить.</p>
      )}

      <div className={styles.list}>
        {plan.map(item => (
          <div key={item.id} className={styles.item}>
            <span className={styles.tooth}>Зуб {item.tooth_number}</span>

            <div className={styles.info}>
              <p className={styles.diagnosis}>{item.diagnosis}</p>
              <p className={styles.treatment}>{item.treatment}</p>
            </div>

            {item.due_date && (
              <span className={styles.due}>до {item.due_date}</span>
            )}

            <select
              className={styles.statusSelect}
              value={item.status}
              onChange={e => updateItem.mutate({ id: item.id, data: { status: e.target.value as TreatmentPlanItem['status'] } })}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {item.status === 'postponed' && (
              <input
                className={styles.postponeInput}
                placeholder="Причина"
                defaultValue={item.postpone_reason}
                onBlur={e => updateItem.mutate({ id: item.id, data: { postpone_reason: e.target.value } })}
              />
            )}

            <button
              className={styles.deleteBtn}
              onClick={() => deleteItem.mutate(item.id)}
              title="Удалить"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Ручная проверка**

Открыть медкарту пациента → под зубной формулой виден список плана. Добавить пункт через боковую панель → строка появляется. Изменить статус на "Завершено" → зуб становится синим (#1677ff). Выбрать "Отложено" → появляется поле причины. Нажать × → строка удаляется.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/TreatmentPlan/
git commit -m "feat(frontend): add TreatmentPlan component with inline status"
```

---

## Task 11: Вкладка Файлы

**Files:**
- Create: `frontend/src/pages/admin/PatientFiles.tsx`
- Create: `frontend/src/pages/admin/PatientFiles.module.css`

- [ ] **Step 1: Создать PatientFiles.module.css**

```css
/* frontend/src/pages/admin/PatientFiles.module.css */
.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.uploadBtn {
  padding: 8px 20px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}

.cardThumb {
  width: 100%;
  height: 120px;
  object-fit: cover;
  cursor: pointer;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.cardThumbImg {
  width: 100%;
  height: 120px;
  object-fit: cover;
  cursor: pointer;
}

.cardBody {
  padding: 10px 12px;
}

.cardType {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #8c8c8c;
  margin: 0 0 4px;
}

.cardDesc {
  font-size: 13px;
  color: #262626;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cardMeta {
  font-size: 11px;
  color: #aaa;
  margin: 0;
}

.cardActions {
  display: flex;
  justify-content: flex-end;
  padding: 0 12px 10px;
}

.delBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: #ff4d4f;
  font-size: 13px;
}

.empty {
  color: #8c8c8c;
  font-size: 14px;
  padding: 20px 0;
}

/* Modal */
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 420px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modalTitle {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}

.dropzone {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  color: #8c8c8c;
  font-size: 14px;
}

.dropzone:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.select,
.input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.modalActions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancelBtn {
  padding: 8px 20px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.submitBtn {
  padding: 8px 20px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.submitBtn:disabled {
  opacity: 0.6;
  cursor: default;
}

/* Image preview modal */
.previewOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.previewImg {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 4px;
}

.previewClose {
  position: absolute;
  top: 20px;
  right: 24px;
  background: none;
  border: none;
  color: #fff;
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
}
```

- [ ] **Step 2: Создать PatientFiles.tsx**

```tsx
// frontend/src/pages/admin/PatientFiles.tsx
import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFiles, uploadFile, deleteFile, PatientFile } from '../../api/files'
import styles from './PatientFiles.module.css'

const FILE_TYPE_LABELS: Record<string, string> = {
  xray: 'Рентген',
  photo: 'Фото',
  document: 'Документ',
  other: 'Другое',
}

const FILE_TYPE_ICONS: Record<string, string> = {
  xray: '🦷',
  photo: '📷',
  document: '📄',
  other: '📎',
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp'])

function isImage(url: string) {
  const ext = url.split('.').pop()?.toLowerCase() ?? ''
  return IMAGE_EXTS.has(ext)
}

interface Props {
  clientId: number
}

export default function PatientFiles({ clientId }: Props) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<string>('photo')
  const [description, setDescription] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const { data: files = [] } = useQuery({
    queryKey: ['files', clientId],
    queryFn: () => getFiles(clientId),
  })

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('file', selectedFile!)
      fd.append('file_type', fileType)
      fd.append('description', description)
      return uploadFile(clientId, fd)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files', clientId] })
      setShowModal(false)
      setSelectedFile(null)
      setFileType('photo')
      setDescription('')
    },
  })

  const del = useMutation({
    mutationFn: (fileId: number) => deleteFile(clientId, fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', clientId] }),
  })

  function openFile(file: PatientFile) {
    if (isImage(file.file)) {
      setPreview(file.file)
    } else if (file.file.endsWith('.pdf')) {
      window.open(file.file, '_blank')
    } else {
      const a = document.createElement('a')
      a.href = file.file
      a.download = file.file.split('/').pop() ?? 'file'
      a.click()
    }
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <button className={styles.uploadBtn} onClick={() => setShowModal(true)}>
          Загрузить файл
        </button>
      </div>

      {files.length === 0 && <p className={styles.empty}>Файлов нет. Загрузите первый.</p>}

      <div className={styles.grid}>
        {files.map(f => (
          <div key={f.id} className={styles.card}>
            {isImage(f.file) ? (
              <img
                src={f.file}
                alt={f.description}
                className={styles.cardThumbImg}
                onClick={() => openFile(f)}
              />
            ) : (
              <div className={styles.cardThumb} onClick={() => openFile(f)}>
                {FILE_TYPE_ICONS[f.file_type] ?? '📎'}
              </div>
            )}
            <div className={styles.cardBody}>
              <p className={styles.cardType}>{FILE_TYPE_LABELS[f.file_type]}</p>
              <p className={styles.cardDesc}>{f.description || '—'}</p>
              <p className={styles.cardMeta}>
                {f.tooth_number ? `Зуб ${f.tooth_number} · ` : ''}
                {new Date(f.uploaded_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div className={styles.cardActions}>
              <button className={styles.delBtn} onClick={() => del.mutate(f.id)}>Удалить</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <p className={styles.modalTitle}>Загрузить файл</p>

            <div
              className={styles.dropzone}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? selectedFile.name : 'Перетащите файл или кликните для выбора'}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf,.dcm"
              style={{ display: 'none' }}
              onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
            />

            <div>
              <p className={styles.label}>Тип</p>
              <select className={styles.select} value={fileType} onChange={e => setFileType(e.target.value)}>
                <option value="xray">Рентген</option>
                <option value="photo">Фото</option>
                <option value="document">Документ</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <div>
              <p className={styles.label}>Описание (необязательно)</p>
              <input
                className={styles.input}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Верхняя челюсть, 2026"
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Отмена</button>
              <button
                className={styles.submitBtn}
                disabled={!selectedFile || upload.isPending}
                onClick={() => upload.mutate()}
              >
                {upload.isPending ? 'Загрузка...' : 'Загрузить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className={styles.previewOverlay} onClick={() => setPreview(null)}>
          <button className={styles.previewClose} onClick={() => setPreview(null)}>×</button>
          <img src={preview} alt="Просмотр" className={styles.previewImg} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Ручная проверка**

Открыть вкладку "Файлы" → кнопка "Загрузить файл" → модальное окно. Выбрать JPG → загрузить → карточка появляется в сетке. Кликнуть на изображение → открывается модальное окно просмотра. Нажать "Удалить" → карточка исчезает.

- [ ] **Step 4: Запустить полный набор тестов**

```bash
docker exec dental_crm-backend-1 bash -c "cd /DENTAL_CRM/src && python manage.py test medical -v 2"
```

Ожидаемый вывод: все тесты `OK`.

- [ ] **Step 5: Финальный commit**

```bash
git add frontend/src/pages/admin/PatientFiles.tsx frontend/src/pages/admin/PatientFiles.module.css
git commit -m "feat(frontend): add PatientFiles tab with upload and preview"
```

---

## Self-Review

### Покрытие спека

| Требование | Задача |
|---|---|
| MedicalNote (анамнез, аллергии, заметки) | Task 1, 3 |
| ToothRecord (FDI, статус, комментарий) | Task 1, 3 |
| TreatmentPlanItem (диагноз, лечение, статус, причина) | Task 1, 4 |
| PatientFile (путь, тип, описание, привязка к зубу/визиту) | Task 1, 5 |
| 20 МБ лимит, форматы jpg/png/webp/pdf/dcm | Task 1, 5 |
| media volume в Docker | Task 2 |
| API 11 эндпоинтов | Task 2, 3 |
| Права: admin = все, doctor = только свои пациенты | Task 3 |
| Автообновление зуба при status=done | Task 3, 4 |
| Уникальность (patient, tooth_number) | Task 1 |
| Переключатель взрослые/молочные зубы | Task 9 |
| Боковая панель при клике на зуб | Task 9 |
| Кнопка "Добавить в план лечения" в боковой панели | Task 9 |
| Inline дропдаун статуса в плане | Task 10 |
| Поле причины при "Отложено" | Task 10 |
| Статус "Завершено" → зуб становится синим | Task 10 |
| Сетка файлов + загрузка через модальное окно | Task 11 |
| Изображения — просмотр в браузере, остальные — скачивание | Task 11 |
| Строки пациентов кликабельны | Task 7 |
| Два пути навигации (список + расписание) | Task 7 (список); расписание уже имеет "Медкарта" кнопку — добавить в Task 7 если отсутствует |

### Проверка: навигация из расписания

Спек требует: "Расписание → клик на запись → кнопка 'Медкарта' → медкарта этого пациента."  
В Task 7 описана только навигация из списка пациентов. В Task 8 `PatientCard` принимает вкладку `defaultTab`.  
Если в `Schedule.tsx` уже есть карточка визита с кнопкой "Медкарта" → нужно добавить `navigate('/admin/patients/{client_id}')` в её обработчик. Этот шаг добавить в Task 7:

- [ ] **Дополнительный шаг Task 7: Кнопка "Медкарта" в расписании**

В `frontend/src/pages/admin/Schedule.tsx` найти карточку визита (появляется при клике на запись) и добавить кнопку:

```tsx
import { useNavigate } from 'react-router-dom'
// ...
const navigate = useNavigate()
// В JSX карточки визита:
<button onClick={() => navigate(`/admin/patients/${record.client}`)}>
  Медкарта
</button>
```

Стили добавить в `Schedule.module.css`:
```css
.medCardBtn {
  padding: 6px 14px;
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
```
