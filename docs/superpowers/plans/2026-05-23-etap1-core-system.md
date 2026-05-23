# Dental CRM — Этап 1: Ядро системы — План реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** REST API на Django + React SPA с JWT-авторизацией и тремя ролями; администратор видит расписание, список пациентов и создаёт записи на приём.

**Architecture:** Django DRF отдаёт JSON API на `/api/v1/`. React (Vite + TypeScript) потребляет его через Axios с JWT Bearer-токеном. Роль пользователя хранится в `User.role` и включается в JWT claims — фронтенд маршрутизирует по роли после входа.

**Tech Stack:** Django 5.0.6 + djangorestframework 3.15 + djangorestframework-simplejwt 5.3 + django-cors-headers | React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + Zustand + TanStack Query + Axios

---

## Карта файлов

### Бэкенд — изменения в `src/`

| Файл | Действие | Назначение |
|---|---|---|
| `requirements.txt` | Изменить | Добавить DRF, SimpleJWT, cors, psycopg2-binary |
| `src/dental/settings.py` | Изменить | INSTALLED_APPS, DRF, JWT, CORS |
| `src/users/models.py` | Изменить | Добавить поле `role` |
| `src/users/jwt.py` | Создать | CustomTokenObtainPairSerializer с role в claims |
| `src/doctors/models.py` | Изменить | Добавить `user` OneToOneField |
| `src/client/models.py` | Изменить | Добавить `user` OneToOneField |
| `src/api/permissions.py` | Создать | IsAdmin, IsDoctor, IsPatient, IsAdminOrDoctor |
| `src/doctors/serializers.py` | Создать | DoctorSerializer, ServiceSerializer, SpecializationSerializer |
| `src/doctors/views.py` | Изменить | DoctorViewSet, ServiceViewSet, SpecializationViewSet |
| `src/doctors/urls.py` | Создать | DRF Router для doctors |
| `src/client/serializers.py` | Создать | ClientSerializer, GenderSerializer, FindOutSerializer |
| `src/client/views.py` | Изменить | ClientViewSet с поиском |
| `src/client/urls.py` | Создать | DRF Router для clients |
| `src/records/serializers.py` | Создать | RecordSerializer и справочники |
| `src/records/views.py` | Изменить | RecordViewSet с фильтром по дате/врачу |
| `src/records/urls.py` | Создать | DRF Router для records |
| `src/api/urls.py` | Изменить | Главный API роутер |
| `src/dental/urls.py` | Изменить | Подключить `/api/v1/` |

### Фронтенд — новая директория `frontend/`

| Файл | Назначение |
|---|---|
| `frontend/package.json` | npm зависимости |
| `frontend/vite.config.ts` | Vite конфиг + proxy на Django :8000 |
| `frontend/src/api/client.ts` | Axios instance с JWT interceptor + auto-refresh |
| `frontend/src/api/auth.ts` | login(), decodeToken() |
| `frontend/src/api/doctors.ts` | getDoctors() |
| `frontend/src/api/patients.ts` | getPatients() с поиском |
| `frontend/src/api/records.ts` | getRecords() с фильтрами |
| `frontend/src/store/authStore.ts` | Zustand: токены, роль, logout |
| `frontend/src/components/ProtectedRoute.tsx` | Редирект по роли |
| `frontend/src/pages/Login.tsx` | Форма входа |
| `frontend/src/pages/admin/Layout.tsx` | Сайдбар + Outlet |
| `frontend/src/pages/admin/Patients.tsx` | Таблица пациентов с поиском |
| `frontend/src/pages/admin/Schedule.tsx` | Список записей с навигацией по дате |
| `frontend/src/pages/admin/NewRecord.tsx` | Форма создания записи |
| `frontend/src/App.tsx` | BrowserRouter + роутинг |
| `frontend/src/main.tsx` | Entry point |

---

## Task 1: Установка пакетов

**Files:**
- Modify: `requirements.txt`

- [ ] **Шаг 1: Обновить requirements.txt**

```
asgiref==3.8.1
Django==5.0.6
sqlparse==0.5.0
tzdata==2024.1
psycopg2-binary==2.9.9
djangorestframework==3.15.2
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.4.0
```

- [ ] **Шаг 2: Установить пакеты**

```bash
pip install -r requirements.txt
```

Ожидаемый результат: `Successfully installed djangorestframework-3.15.2 djangorestframework-simplejwt-5.3.1 django-cors-headers-4.4.0 psycopg2-binary-2.9.9`

- [ ] **Шаг 3: Закоммитить**

```bash
git add requirements.txt
git commit -m "chore: добавить DRF, SimpleJWT, cors, psycopg2-binary"
```

---

## Task 2: Настройка settings.py

**Files:**
- Modify: `src/dental/settings.py`

- [ ] **Шаг 1: Заменить INSTALLED_APPS**

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    # Local
    'client',
    'users',
    'doctors',
    'records',
    'api',
]
```

- [ ] **Шаг 2: Добавить CorsMiddleware первым в MIDDLEWARE**

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

- [ ] **Шаг 3: Добавить конфиги DRF, JWT, CORS в конец settings.py**

```python
from datetime import timedelta

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'TOKEN_OBTAIN_SERIALIZER': 'users.jwt.CustomTokenObtainPairSerializer',
}
```

- [ ] **Шаг 4: Проверить запуск**

```bash
cd src && python manage.py check
```

Ожидаемый результат: `System check identified no issues (0 silenced).`

- [ ] **Шаг 5: Закоммитить**

```bash
git add src/dental/settings.py
git commit -m "feat: настроить DRF, SimpleJWT, CORS в settings"
```

---

## Task 3: Поле role в User

**Files:**
- Modify: `src/users/models.py`
- Test: `src/users/tests.py`

- [ ] **Шаг 1: Написать тест**

```python
# src/users/tests.py
from django.test import TestCase
from users.models import User


class UserRoleTest(TestCase):
    def test_default_role_is_admin(self):
        user = User.objects.create_user(email='admin@test.com', password='pass123')
        self.assertEqual(user.role, 'admin')

    def test_doctor_role(self):
        user = User.objects.create_user(email='doc@test.com', password='pass123', role='doctor')
        self.assertEqual(user.role, 'doctor')

    def test_patient_role(self):
        user = User.objects.create_user(email='pat@test.com', password='pass123', role='patient')
        self.assertEqual(user.role, 'patient')
```

- [ ] **Шаг 2: Запустить тест — должен упасть**

```bash
cd src && python manage.py test users.tests.UserRoleTest -v 2
```

Ожидаемый результат: `ERROR — create_user() got an unexpected keyword argument 'role'`

- [ ] **Шаг 3: Добавить поле role в модель User**

Полностью заменить содержимое `src/users/models.py`:

```python
from django.db import models
from django.contrib.auth.models import AbstractUser
from .managers import UserManager


class User(AbstractUser):
    ROLE_ADMIN = 'admin'
    ROLE_DOCTOR = 'doctor'
    ROLE_PATIENT = 'patient'
    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Администратор'),
        (ROLE_DOCTOR, 'Врач'),
        (ROLE_PATIENT, 'Пациент'),
    ]

    username = None
    email = models.EmailField('Email', unique=True)
    first_name = models.CharField('Имя', max_length=255)
    last_name = models.CharField('Фамилия', max_length=255)
    date_of_birth = models.DateField('Дата рождения', null=True, blank=True)
    mobile_phone = models.CharField('Телефон', max_length=15, null=True, blank=True)
    role = models.CharField('Роль', max_length=20, choices=ROLE_CHOICES, default=ROLE_ADMIN)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    groups = models.ManyToManyField(
        'auth.Group', related_name='custom_user_groups', blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission', related_name='custom_user_permissions', blank=True,
    )

    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'UserAccount'
        ordering = ['-created_at']
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return f'{self.id} - {self.email}'
```

- [ ] **Шаг 4: Создать и применить миграцию**

```bash
cd src && python manage.py makemigrations users
python manage.py migrate
```

Ожидаемый результат: `Applying users.0002_user_role... OK`

- [ ] **Шаг 5: Запустить тест — должен пройти**

```bash
python manage.py test users.tests.UserRoleTest -v 2
```

Ожидаемый результат: `OK — Ran 3 tests`

- [ ] **Шаг 6: Закоммитить**

```bash
git add src/users/models.py src/users/migrations/
git commit -m "feat: добавить поле role в User (admin/doctor/patient)"
```

---

## Task 4: Привязать Doctors и Client к User

**Files:**
- Modify: `src/doctors/models.py`
- Modify: `src/client/models.py`

- [ ] **Шаг 1: Добавить user в Doctors**

В `src/doctors/models.py` добавить импорт и поле в начало класса `Doctors`:

```python
from django.conf import settings

class Doctors(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='doctors_profile',
    )
    first_name = models.CharField('Имя', max_length=255)
    last_name = models.CharField('Фамилия', max_length=255)
    father_name = models.CharField('Отчество', max_length=255)
    body = models.TextField(blank=True, default='')
    services_id = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True, null=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True, null=True)

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    class Meta:
        verbose_name = 'Врач'
        verbose_name_plural = 'Врачи'
```

- [ ] **Шаг 2: Добавить user в Client**

В `src/client/models.py` добавить импорт и поле в начало класса `Client`:

```python
from django.conf import settings

class Client(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='client_profile',
    )
    first_name = models.CharField('Имя', max_length=255)
    last_name = models.CharField('Фамилия', max_length=255)
    father_name = models.CharField('Отчество', max_length=255)
    gender = models.ForeignKey(Gender, verbose_name='Пол', on_delete=models.CASCADE)
    mobile_phone = models.CharField('Телефон', max_length=15, null=True, blank=True)
    iin = models.CharField('ИИН', max_length=12, null=True, blank=True)
    date_of_birth = models.DateField('Дата рождения', null=True, blank=True)
    find_out = models.ForeignKey(FindOut, verbose_name='Как узнал', on_delete=models.CASCADE)
    ltv = models.ForeignKey(Ltv, on_delete=models.SET_NULL, null=True, blank=True)
    doctor = models.ForeignKey(Doctors, on_delete=models.CASCADE)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True, null=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True, null=True)

    def __str__(self):
        return f'{self.first_name} {self.last_name}'

    class Meta:
        verbose_name = 'Клиент'
        verbose_name_plural = 'Клиенты'
```

- [ ] **Шаг 3: Создать и применить миграции**

```bash
cd src && python manage.py makemigrations doctors client
python manage.py migrate
```

Ожидаемый результат: `Applying doctors.0002_doctors_user... OK` и `Applying client.0002_client_user... OK`

- [ ] **Шаг 4: Закоммитить**

```bash
git add src/doctors/models.py src/client/models.py src/doctors/migrations/ src/client/migrations/
git commit -m "feat: связать Doctors и Client с User через OneToOneField"
```

---

## Task 5: Кастомный JWT с role в claims

**Files:**
- Create: `src/users/jwt.py`
- Modify: `src/api/urls.py`
- Modify: `src/dental/urls.py`
- Test: `src/users/tests.py`

- [ ] **Шаг 1: Добавить тест**

Добавить в `src/users/tests.py`:

```python
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken


class JWTClaimsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='admin@clinic.com', password='testpass123', role='admin',
            first_name='Ғани', last_name='Беков',
        )
        self.api = APIClient()

    def test_token_contains_role(self):
        response = self.api.post('/api/v1/token/', {
            'email': 'admin@clinic.com',
            'password': 'testpass123',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        token = AccessToken(response.data['access'])
        self.assertEqual(token['role'], 'admin')
        self.assertEqual(token['email'], 'admin@clinic.com')
```

- [ ] **Шаг 2: Запустить тест — должен упасть**

```bash
cd src && python manage.py test users.tests.JWTClaimsTest -v 2
```

Ожидаемый результат: `FAIL — 404 Not Found` (URL ещё не подключён)

- [ ] **Шаг 3: Создать src/users/jwt.py**

```python
# src/users/jwt.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        token['full_name'] = f'{user.last_name} {user.first_name}'.strip()
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
```

- [ ] **Шаг 4: Создать src/api/urls.py**

```python
# src/api/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users.jwt import CustomTokenObtainPairView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
```

- [ ] **Шаг 5: Обновить src/dental/urls.py**

```python
# src/dental/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.urls')),
]
```

- [ ] **Шаг 6: Запустить тест — должен пройти**

```bash
cd src && python manage.py test users.tests.JWTClaimsTest -v 2
```

Ожидаемый результат: `OK`

- [ ] **Шаг 7: Закоммитить**

```bash
git add src/users/jwt.py src/api/urls.py src/dental/urls.py
git commit -m "feat: JWT токен с role, email, full_name в claims"
```

---

## Task 6: Permissions

**Files:**
- Create: `src/api/permissions.py`
- Test: `src/api/tests.py`

- [ ] **Шаг 1: Написать тест**

Создать `src/api/tests.py`:

```python
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView
from rest_framework.response import Response
from api.permissions import IsAdmin, IsDoctor, IsPatient
from users.models import User


class AdminOnlyView(APIView):
    permission_classes = [IsAdmin]
    def get(self, request):
        return Response({'ok': True})


class PermissionsTest(TestCase):
    def setUp(self):
        self.admin   = User.objects.create_user(email='a@t.com', password='p', role='admin')
        self.doctor  = User.objects.create_user(email='d@t.com', password='p', role='doctor')
        self.patient = User.objects.create_user(email='p@t.com', password='p', role='patient')
        self.factory = APIRequestFactory()

    def _get(self, view, user):
        request = self.factory.get('/')
        request.user = user
        return view(request)

    def test_admin_can_access_admin_view(self):
        self.assertEqual(self._get(AdminOnlyView.as_view(), self.admin).status_code, 200)

    def test_doctor_cannot_access_admin_view(self):
        self.assertEqual(self._get(AdminOnlyView.as_view(), self.doctor).status_code, 403)

    def test_patient_cannot_access_admin_view(self):
        self.assertEqual(self._get(AdminOnlyView.as_view(), self.patient).status_code, 403)
```

- [ ] **Шаг 2: Запустить — должен упасть**

```bash
cd src && python manage.py test api.tests.PermissionsTest -v 2
```

Ожидаемый результат: `ERROR — No module named 'api.permissions'`

- [ ] **Шаг 3: Создать src/api/permissions.py**

```python
# src/api/permissions.py
from rest_framework.permissions import BasePermission
from users.models import User


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.ROLE_ADMIN
        )


class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.ROLE_DOCTOR
        )


class IsPatient(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.ROLE_PATIENT
        )


class IsAdminOrDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in (User.ROLE_ADMIN, User.ROLE_DOCTOR)
        )
```

- [ ] **Шаг 4: Запустить тест — должен пройти**

```bash
cd src && python manage.py test api.tests.PermissionsTest -v 2
```

Ожидаемый результат: `OK — Ran 3 tests`

- [ ] **Шаг 5: Закоммитить**

```bash
git add src/api/permissions.py src/api/tests.py
git commit -m "feat: permissions IsAdmin, IsDoctor, IsPatient, IsAdminOrDoctor"
```

---

## Task 7: Doctors API

**Files:**
- Create: `src/doctors/serializers.py`
- Modify: `src/doctors/views.py`
- Create: `src/doctors/urls.py`
- Test: `src/doctors/tests.py`

- [ ] **Шаг 1: Написать тесты**

```python
# src/doctors/tests.py
from django.test import TestCase
from rest_framework.test import APIClient
from users.models import User
from doctors.models import Doctors, Specialization, Service


class DoctorsAPITest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@clinic.com', password='pass123', role='admin'
        )
        self.spec    = Specialization.objects.create(title='Терапия', cost=5000)
        self.service = Service.objects.create(title='Пломба', spec_id=self.spec)
        self.doctor  = Doctors.objects.create(
            first_name='Иван', last_name='Петров', father_name='Сергеевич',
            services_id=self.service,
        )
        self.api = APIClient()
        r = self.api.post('/api/v1/token/', {'email': 'admin@clinic.com', 'password': 'pass123'}, format='json')
        self.api.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data["access"]}')

    def test_list_doctors(self):
        r = self.api.get('/api/v1/doctors/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data['results']), 1)

    def test_doctor_detail(self):
        r = self.api.get(f'/api/v1/doctors/{self.doctor.id}/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['last_name'], 'Петров')

    def test_create_doctor_as_admin(self):
        r = self.api.post('/api/v1/doctors/', {
            'first_name': 'Анна', 'last_name': 'Иванова', 'father_name': 'Петровна',
            'services_id': self.service.id,
        }, format='json')
        self.assertEqual(r.status_code, 201)

    def test_unauthenticated_blocked(self):
        self.api.credentials()
        r = self.api.get('/api/v1/doctors/')
        self.assertEqual(r.status_code, 401)
```

- [ ] **Шаг 2: Запустить — должен упасть**

```bash
cd src && python manage.py test doctors.tests -v 2
```

Ожидаемый результат: `FAIL — 404 Not Found`

- [ ] **Шаг 3: Создать src/doctors/serializers.py**

```python
# src/doctors/serializers.py
from rest_framework import serializers
from .models import Doctors, Assistant, Specialization, Service


class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ['id', 'title', 'cost']


class ServiceSerializer(serializers.ModelSerializer):
    spec_id = SpecializationSerializer(read_only=True)
    spec_id_id = serializers.PrimaryKeyRelatedField(
        queryset=Specialization.objects.all(), source='spec_id', write_only=True,
    )

    class Meta:
        model = Service
        fields = ['id', 'title', 'spec_id', 'spec_id_id']


class DoctorSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Doctors
        fields = ['id', 'first_name', 'last_name', 'father_name', 'full_name', 'body', 'services_id']

    def get_full_name(self, obj):
        return f'{obj.last_name} {obj.first_name} {obj.father_name}'.strip()


class AssistantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assistant
        fields = ['id', 'first_name', 'last_name', 'father_name', 'services_id']
```

- [ ] **Шаг 4: Заменить src/doctors/views.py**

```python
# src/doctors/views.py
from rest_framework import viewsets
from api.permissions import IsAdmin, IsAdminOrDoctor
from .models import Doctors, Assistant, Specialization, Service
from .serializers import DoctorSerializer, AssistantSerializer, SpecializationSerializer, ServiceSerializer


class SpecializationViewSet(viewsets.ModelViewSet):
    queryset = Specialization.objects.all()
    serializer_class = SpecializationSerializer
    permission_classes = [IsAdminOrDoctor]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related('spec_id').all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminOrDoctor]


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctors.objects.select_related('services_id').all()
    serializer_class = DoctorSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrDoctor()]
        return [IsAdmin()]


class AssistantViewSet(viewsets.ModelViewSet):
    queryset = Assistant.objects.all()
    serializer_class = AssistantSerializer
    permission_classes = [IsAdminOrDoctor]
```

- [ ] **Шаг 5: Создать src/doctors/urls.py**

```python
# src/doctors/urls.py
from rest_framework.routers import DefaultRouter
from .views import DoctorViewSet, AssistantViewSet, SpecializationViewSet, ServiceViewSet

router = DefaultRouter()
router.register('doctors', DoctorViewSet, basename='doctor')
router.register('assistants', AssistantViewSet, basename='assistant')
router.register('specializations', SpecializationViewSet, basename='specialization')
router.register('services', ServiceViewSet, basename='service')

urlpatterns = router.urls
```

- [ ] **Шаг 6: Обновить src/api/urls.py**

```python
# src/api/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.jwt import CustomTokenObtainPairView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include('doctors.urls')),
]
```

- [ ] **Шаг 7: Запустить тесты**

```bash
cd src && python manage.py test doctors.tests -v 2
```

Ожидаемый результат: `OK — Ran 4 tests`

- [ ] **Шаг 8: Закоммитить**

```bash
git add src/doctors/ src/api/urls.py
git commit -m "feat: Doctors API — CRUD для врачей, ассистентов, специализаций, услуг"
```

---

## Task 8: Client (Patients) API

**Files:**
- Create: `src/client/serializers.py`
- Modify: `src/client/views.py`
- Create: `src/client/urls.py`
- Test: `src/client/tests.py`

- [ ] **Шаг 1: Написать тесты**

```python
# src/client/tests.py
from django.test import TestCase
from rest_framework.test import APIClient
from users.models import User
from doctors.models import Doctors, Specialization, Service
from client.models import Client, Gender, FindOut


class ClientAPITest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email='admin@clinic.com', password='pass123', role='admin')
        spec   = Specialization.objects.create(title='Терапия', cost=5000)
        svc    = Service.objects.create(title='Пломба', spec_id=spec)
        self.doctor  = Doctors.objects.create(first_name='Иван', last_name='Петров', father_name='С.', services_id=svc)
        self.gender   = Gender.objects.create(gender_name='Женский')
        self.find_out = FindOut.objects.create(find_out_name='Интернет')
        self.patient  = Client.objects.create(
            first_name='Айгуль', last_name='Сатова', father_name='Асетовна',
            gender=self.gender, find_out=self.find_out, doctor=self.doctor,
            mobile_phone='+77001234567',
        )
        self.api = APIClient()
        r = self.api.post('/api/v1/token/', {'email': 'admin@clinic.com', 'password': 'pass123'}, format='json')
        self.api.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data["access"]}')

    def test_list_clients(self):
        r = self.api.get('/api/v1/clients/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data['results']), 1)

    def test_client_detail(self):
        r = self.api.get(f'/api/v1/clients/{self.patient.id}/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['last_name'], 'Сатова')

    def test_search_by_phone(self):
        r = self.api.get('/api/v1/clients/?search=77001234567')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data['results']), 1)

    def test_search_no_match(self):
        r = self.api.get('/api/v1/clients/?search=xxxxxx')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data['results']), 0)
```

- [ ] **Шаг 2: Запустить — должен упасть**

```bash
cd src && python manage.py test client.tests -v 2
```

Ожидаемый результат: `FAIL — 404`

- [ ] **Шаг 3: Создать src/client/serializers.py**

```python
# src/client/serializers.py
from rest_framework import serializers
from .models import Client, Gender, FindOut


class GenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gender
        fields = ['id', 'gender_name']


class FindOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = FindOut
        fields = ['id', 'find_out_name']


class ClientSerializer(serializers.ModelSerializer):
    full_name         = serializers.SerializerMethodField()
    gender_name       = serializers.CharField(source='gender.gender_name', read_only=True)
    find_out_name     = serializers.CharField(source='find_out.find_out_name', read_only=True)
    doctor_name       = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'first_name', 'last_name', 'father_name', 'full_name',
            'gender', 'gender_name', 'mobile_phone', 'iin', 'date_of_birth',
            'find_out', 'find_out_name', 'doctor', 'doctor_name', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_full_name(self, obj):
        return f'{obj.last_name} {obj.first_name} {obj.father_name}'.strip()

    def get_doctor_name(self, obj):
        if obj.doctor:
            return f'{obj.doctor.last_name} {obj.doctor.first_name}'
        return ''
```

- [ ] **Шаг 4: Заменить src/client/views.py**

```python
# src/client/views.py
from rest_framework import viewsets, filters
from api.permissions import IsAdmin, IsAdminOrDoctor
from .models import Client, Gender, FindOut
from .serializers import ClientSerializer, GenderSerializer, FindOutSerializer


class GenderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Gender.objects.all()
    serializer_class = GenderSerializer
    permission_classes = [IsAdminOrDoctor]


class FindOutViewSet(viewsets.ModelViewSet):
    queryset = FindOut.objects.all()
    serializer_class = FindOutSerializer
    permission_classes = [IsAdmin]


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('gender', 'find_out', 'doctor').order_by('-created_at')
    serializer_class = ClientSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'father_name', 'mobile_phone', 'iin']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrDoctor()]
        return [IsAdmin()]
```

- [ ] **Шаг 5: Создать src/client/urls.py**

```python
# src/client/urls.py
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, GenderViewSet, FindOutViewSet

router = DefaultRouter()
router.register('clients', ClientViewSet, basename='client')
router.register('genders', GenderViewSet, basename='gender')
router.register('find-outs', FindOutViewSet, basename='find-out')

urlpatterns = router.urls
```

- [ ] **Шаг 6: Добавить в src/api/urls.py**

```python
# src/api/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.jwt import CustomTokenObtainPairView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include('doctors.urls')),
    path('', include('client.urls')),
]
```

- [ ] **Шаг 7: Запустить тесты**

```bash
cd src && python manage.py test client.tests -v 2
```

Ожидаемый результат: `OK — Ran 4 tests`

- [ ] **Шаг 8: Закоммитить**

```bash
git add src/client/ src/api/urls.py
git commit -m "feat: Client API — список и поиск пациентов по ФИО/телефону/ИИН"
```

---

## Task 9: Records (Appointments) API

**Files:**
- Create: `src/records/serializers.py`
- Modify: `src/records/views.py`
- Create: `src/records/urls.py`
- Test: `src/records/tests.py`

- [ ] **Шаг 1: Написать тесты**

```python
# src/records/tests.py
import datetime
from django.test import TestCase
from rest_framework.test import APIClient
from users.models import User
from doctors.models import Doctors, Specialization, Service
from client.models import Client, Gender, FindOut
from records.models import Record, Status, ChairNum, RecordingType, PaymentType, PaymentState


class RecordsAPITest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(email='admin@clinic.com', password='pass123', role='admin')
        spec   = Specialization.objects.create(title='Терапия', cost=5000)
        svc    = Service.objects.create(title='Пломба', spec_id=spec)
        doctor = Doctors.objects.create(first_name='Иван', last_name='Петров', father_name='С.', services_id=svc)
        gender   = Gender.objects.create(gender_name='Женский')
        find_out = FindOut.objects.create(find_out_name='Интернет')
        patient  = Client.objects.create(
            first_name='Айгуль', last_name='Сатова', father_name='А.',
            gender=gender, find_out=find_out, doctor=doctor,
        )
        status    = Status.objects.create(title='Ожидает')
        chair     = ChairNum.objects.create(title='Кабинет 1')
        rec_type  = RecordingType.objects.create(title='Первичный')
        pay_type  = PaymentType.objects.create(title='Наличные')
        pay_state = PaymentState.objects.create(title='Не оплачено')
        self.today  = datetime.date.today()
        self.doctor = doctor
        self.record = Record.objects.create(
            client=patient, client_first_name='Айгуль', client_last_name='Сатова',
            client_father_name='А.', doctor=doctor, doctors_name='Петров Иван',
            assistant=None, assistant_name='', service=svc, specialization=spec,
            tooth=11, specialization_cost=5000, count=1, sell=0, total=5000,
            registration_date=self.today, record_start=self.today,
            record_end=self.today, reception_day=self.today,
            recording_type=rec_type, chair=chair, payment_type=pay_type,
            payment_state=pay_state, status=status,
        )
        self.api = APIClient()
        r = self.api.post('/api/v1/token/', {'email': 'admin@clinic.com', 'password': 'pass123'}, format='json')
        self.api.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data["access"]}')

    def test_list_records(self):
        r = self.api.get('/api/v1/records/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data['results']), 1)

    def test_filter_by_date(self):
        r = self.api.get(f'/api/v1/records/?reception_day={self.today}')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data['results']), 1)

    def test_filter_by_doctor(self):
        r = self.api.get(f'/api/v1/records/?doctor={self.doctor.id}')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data['results']), 1)
```

- [ ] **Шаг 2: Запустить — должен упасть**

```bash
cd src && python manage.py test records.tests -v 2
```

Ожидаемый результат: `FAIL — 404`

- [ ] **Шаг 3: Создать src/records/serializers.py**

```python
# src/records/serializers.py
from rest_framework import serializers
from .models import Record, Status, ChairNum, RecordingType, PaymentType, PaymentState


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ['id', 'title']


class ChairNumSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChairNum
        fields = ['id', 'title']


class RecordingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecordingType
        fields = ['id', 'title']


class PaymentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentType
        fields = ['id', 'title']


class PaymentStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentState
        fields = ['id', 'title']


class RecordSerializer(serializers.ModelSerializer):
    status_title        = serializers.CharField(source='status.title', read_only=True)
    doctor_name         = serializers.SerializerMethodField()
    chair_title         = serializers.CharField(source='chair.title', read_only=True, default='')
    payment_state_title = serializers.CharField(source='payment_state.title', read_only=True, default='')

    class Meta:
        model = Record
        fields = [
            'id',
            'client', 'client_first_name', 'client_last_name', 'client_father_name',
            'doctor', 'doctor_name', 'assistant', 'assistant_name',
            'service', 'specialization', 'tooth',
            'specialization_cost', 'count', 'sell', 'total',
            'registration_date', 'record_start', 'record_end', 'reception_day',
            'recording_type', 'notes', 'reason',
            'chair', 'chair_title',
            'payment_type', 'payment_state', 'payment_state_title',
            'status', 'status_title',
            'created_at',
        ]
        read_only_fields = ['created_at']

    def get_doctor_name(self, obj):
        if obj.doctor:
            return f'{obj.doctor.last_name} {obj.doctor.first_name}'
        return ''
```

- [ ] **Шаг 4: Заменить src/records/views.py**

```python
# src/records/views.py
from rest_framework import viewsets, filters
from api.permissions import IsAdmin, IsAdminOrDoctor
from .models import Record, Status, ChairNum, RecordingType, PaymentType, PaymentState
from .serializers import (
    RecordSerializer, StatusSerializer, ChairNumSerializer,
    RecordingTypeSerializer, PaymentTypeSerializer, PaymentStateSerializer,
)


class RecordViewSet(viewsets.ModelViewSet):
    serializer_class = RecordSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['client_first_name', 'client_last_name', 'doctors_name']

    def get_queryset(self):
        qs = Record.objects.select_related(
            'client', 'doctor', 'service', 'specialization',
            'chair', 'status', 'payment_type', 'payment_state',
        ).order_by('-reception_day', '-created_at')
        reception_day = self.request.query_params.get('reception_day')
        doctor = self.request.query_params.get('doctor')
        if reception_day:
            qs = qs.filter(reception_day=reception_day)
        if doctor:
            qs = qs.filter(doctor_id=doctor)
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrDoctor()]
        return [IsAdmin()]


class StatusViewSet(viewsets.ModelViewSet):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer
    permission_classes = [IsAdmin]


class ChairNumViewSet(viewsets.ModelViewSet):
    queryset = ChairNum.objects.all()
    serializer_class = ChairNumSerializer
    permission_classes = [IsAdmin]


class RecordingTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RecordingType.objects.all()
    serializer_class = RecordingTypeSerializer
    permission_classes = [IsAdminOrDoctor]


class PaymentTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaymentType.objects.all()
    serializer_class = PaymentTypeSerializer
    permission_classes = [IsAdminOrDoctor]


class PaymentStateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PaymentState.objects.all()
    serializer_class = PaymentStateSerializer
    permission_classes = [IsAdminOrDoctor]
```

- [ ] **Шаг 5: Создать src/records/urls.py**

```python
# src/records/urls.py
from rest_framework.routers import DefaultRouter
from .views import (
    RecordViewSet, StatusViewSet, ChairNumViewSet,
    RecordingTypeViewSet, PaymentTypeViewSet, PaymentStateViewSet,
)

router = DefaultRouter()
router.register('records', RecordViewSet, basename='record')
router.register('statuses', StatusViewSet, basename='status')
router.register('chairs', ChairNumViewSet, basename='chair')
router.register('recording-types', RecordingTypeViewSet, basename='recording-type')
router.register('payment-types', PaymentTypeViewSet, basename='payment-type')
router.register('payment-states', PaymentStateViewSet, basename='payment-state')

urlpatterns = router.urls
```

- [ ] **Шаг 6: Финально обновить src/api/urls.py**

```python
# src/api/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.jwt import CustomTokenObtainPairView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include('doctors.urls')),
    path('', include('client.urls')),
    path('', include('records.urls')),
]
```

- [ ] **Шаг 7: Запустить все backend-тесты**

```bash
cd src && python manage.py test users doctors client records api -v 2
```

Ожидаемый результат: `OK` — все тесты проходят

- [ ] **Шаг 8: Закоммитить**

```bash
git add src/records/ src/api/urls.py
git commit -m "feat: Records API — расписание с фильтром по дате и врачу"
```

---

## Task 10: React-проект (Vite + TypeScript + Tailwind)

**Files:**
- Create: `frontend/` (новая директория)

- [ ] **Шаг 1: Создать Vite-проект**

```bash
cd C:\Users\murat\Desktop\dental_crm
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Шаг 2: Установить зависимости**

```bash
npm install axios zustand @tanstack/react-query react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Шаг 3: Настроить tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Шаг 4: Заменить frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Шаг 5: Настроить vite.config.ts с proxy**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Шаг 6: Проверить запуск**

```bash
npm run dev
```

Ожидаемый результат: `VITE ready ➜ Local: http://localhost:5173/`

- [ ] **Шаг 7: Закоммитить**

```bash
cd ..
git add frontend/
git commit -m "feat: создать React-проект (Vite + TypeScript + Tailwind)"
```

---

## Task 11: Axios client + Zustand auth store

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/store/authStore.ts`

- [ ] **Шаг 1: Создать frontend/src/api/client.ts**

```ts
import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/v1/token/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          orig.headers.Authorization = `Bearer ${data.access}`
          return api(orig)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
```

- [ ] **Шаг 2: Создать frontend/src/api/auth.ts**

```ts
import axios from 'axios'

export interface TokenPayload {
  role: 'admin' | 'doctor' | 'patient'
  email: string
  full_name: string
  exp: number
}

export function decodeToken(token: string): TokenPayload {
  return JSON.parse(atob(token.split('.')[1]))
}

export async function login(email: string, password: string) {
  const { data } = await axios.post<{ access: string; refresh: string }>(
    '/api/v1/token/', { email, password }
  )
  return data
}
```

- [ ] **Шаг 3: Создать frontend/src/store/authStore.ts**

```ts
import { create } from 'zustand'
import { decodeToken } from '../api/auth'

interface AuthState {
  role: 'admin' | 'doctor' | 'patient' | null
  email: string | null
  fullName: string | null
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  logout: () => void
}

function loadRole() {
  const t = localStorage.getItem('access_token')
  if (!t) return null
  try { return decodeToken(t).role } catch { return null }
}

export const useAuthStore = create<AuthState>((set) => ({
  role: loadRole(),
  email: null,
  fullName: null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  setTokens(access, refresh) {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    const p = decodeToken(access)
    set({ role: p.role, email: p.email, fullName: p.full_name, isAuthenticated: true })
  },

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ role: null, email: null, fullName: null, isAuthenticated: false })
  },
}))
```

- [ ] **Шаг 4: Закоммитить**

```bash
git add frontend/src/api/ frontend/src/store/
git commit -m "feat: Axios с JWT refresh + Zustand auth store"
```

---

## Task 12: Страница входа

**Files:**
- Create: `frontend/src/pages/Login.tsx`

- [ ] **Шаг 1: Создать frontend/src/pages/Login.tsx**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access, refresh } = await login(email, password)
      setTokens(access, refresh)
      navigate('/admin/schedule')
    } catch {
      setError('Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1 text-center">🦷 Dental CRM</h1>
        <p className="text-gray-500 text-sm text-center mb-8">Войдите в систему</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="admin@clinic.kz"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Пароль</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Шаг 2: Закоммитить**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "feat: страница входа с JWT авторизацией"
```

---

## Task 13: ProtectedRoute + App роутинг

**Files:**
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Шаг 1: Создать frontend/src/components/ProtectedRoute.tsx**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
  allowedRoles: Array<'admin' | 'doctor' | 'patient'>
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && !allowedRoles.includes(role)) {
    const map = { admin: '/admin', doctor: '/doctor', patient: '/patient' } as const
    return <Navigate to={map[role]} replace />
  }
  return <>{children}</>
}
```

- [ ] **Шаг 2: Заменить frontend/src/App.tsx**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AdminLayout from './pages/admin/Layout'
import Patients from './pages/admin/Patients'
import Schedule from './pages/admin/Schedule'
import NewRecord from './pages/admin/NewRecord'

const qc = new QueryClient()

function RootRedirect() {
  const { isAuthenticated, role } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role === 'admin') return <Navigate to="/admin/schedule" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="patients" element={<Patients />} />
            <Route path="records/new" element={<NewRecord />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

- [ ] **Шаг 3: Заменить frontend/src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

- [ ] **Шаг 4: Закоммитить**

```bash
git add frontend/src/
git commit -m "feat: роутинг по ролям, ProtectedRoute, App"
```

---

## Task 14: Admin Layout (сайдбар)

**Files:**
- Create: `frontend/src/pages/admin/Layout.tsx`

- [ ] **Шаг 1: Создать frontend/src/pages/admin/Layout.tsx**

```tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const nav = [
  { to: '/admin/schedule', icon: '📅', label: 'Расписание' },
  { to: '/admin/patients', icon: '👥', label: 'Пациенты' },
  { to: '/admin/records/new', icon: '➕', label: 'Новая запись' },
]

export default function AdminLayout() {
  const { fullName, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-gray-950">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800">
          <div className="text-white font-bold">🦷 Dental CRM</div>
          <div className="text-gray-500 text-xs mt-0.5 truncate">{fullName ?? 'Администратор'}</div>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="w-full text-left px-3 py-2 text-gray-500 hover:text-red-400 text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            Выйти
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  )
}
```

- [ ] **Шаг 2: Закоммитить**

```bash
git add frontend/src/pages/admin/Layout.tsx
git commit -m "feat: Admin Layout с боковой навигацией"
```

---

## Task 15: Страница пациентов

**Files:**
- Create: `frontend/src/api/patients.ts`
- Create: `frontend/src/pages/admin/Patients.tsx`

- [ ] **Шаг 1: Создать frontend/src/api/patients.ts**

```ts
import api from './client'

export interface Patient {
  id: number
  full_name: string
  first_name: string
  last_name: string
  father_name: string
  mobile_phone: string | null
  iin: string | null
  date_of_birth: string | null
  gender_name: string
  find_out_name: string
  doctor_name: string
  created_at: string
}

export interface Paginated<T> { count: number; results: T[]; next: string | null; previous: string | null }

export async function getPatients(search?: string): Promise<Paginated<Patient>> {
  const { data } = await api.get<Paginated<Patient>>('/clients/', { params: search ? { search } : {} })
  return data
}
```

- [ ] **Шаг 2: Создать frontend/src/pages/admin/Patients.tsx**

```tsx
import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPatients } from '../../api/patients'

export default function Patients() {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const { data, isLoading } = useQuery({
    queryKey: ['patients', q],
    queryFn: () => getPatients(q || undefined),
  })

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setQ(e.target.value), 400)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Пациенты</h1>
        <span className="text-gray-500 text-sm">{data?.count ?? 0} всего</span>
      </div>
      <input
        value={search} onChange={handleSearch}
        placeholder="Поиск по ФИО, телефону, ИИН..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 mb-6"
      />
      {isLoading ? (
        <div className="text-gray-500 text-center py-12">Загрузка...</div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">ФИО</th>
                <th className="text-left px-4 py-3">Телефон</th>
                <th className="text-left px-4 py-3">ИИН</th>
                <th className="text-left px-4 py-3">Врач</th>
                <th className="text-left px-4 py-3">Дата рождения</th>
              </tr>
            </thead>
            <tbody>
              {data?.results.map((p) => (
                <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                  <td className="px-4 py-3 text-white font-medium">{p.full_name}</td>
                  <td className="px-4 py-3 text-gray-400">{p.mobile_phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-sm">{p.iin ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{p.doctor_name}</td>
                  <td className="px-4 py-3 text-gray-400">{p.date_of_birth ?? '—'}</td>
                </tr>
              ))}
              {data?.results.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-600">Пациенты не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Шаг 3: Закоммитить**

```bash
git add frontend/src/api/patients.ts frontend/src/pages/admin/Patients.tsx
git commit -m "feat: страница пациентов с поиском по ФИО/телефону/ИИН"
```

---

## Task 16: Страница расписания

**Files:**
- Create: `frontend/src/api/records.ts`
- Create: `frontend/src/pages/admin/Schedule.tsx`

- [ ] **Шаг 1: Создать frontend/src/api/records.ts**

```ts
import api from './client'
import type { Paginated } from './patients'

export interface AppointmentRecord {
  id: number
  client_first_name: string
  client_last_name: string
  client_father_name: string
  doctor: number
  doctor_name: string
  record_start: string
  record_end: string
  reception_day: string
  status_title: string
  chair_title: string
  total: number
  payment_state_title: string
}

export async function getRecords(params: { reception_day?: string; doctor?: number } = {}) {
  const { data } = await api.get<Paginated<AppointmentRecord>>('/records/', { params })
  return data
}

export async function createRecord(payload: Record<string, unknown>) {
  const { data } = await api.post('/records/', payload)
  return data
}
```

- [ ] **Шаг 2: Создать frontend/src/pages/admin/Schedule.tsx**

```tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getRecords } from '../../api/records'

const STATUS_STYLE: Record<string, string> = {
  'Ожидает':   'bg-yellow-900/30 border-yellow-700/50 text-yellow-300',
  'На приёме': 'bg-blue-900/30 border-blue-700/50 text-blue-300',
  'Завершён':  'bg-green-900/30 border-green-700/50 text-green-300',
  'Отменён':   'bg-red-900/30 border-red-700/50 text-red-300',
}

function toISO(d: Date) { return d.toISOString().split('T')[0] }

export default function Schedule() {
  const today = toISO(new Date())
  const [date, setDate] = useState(today)

  const { data, isLoading } = useQuery({
    queryKey: ['records', date],
    queryFn: () => getRecords({ reception_day: date }),
  })

  function shift(n: number) {
    const d = new Date(date); d.setDate(d.getDate() + n); setDate(toISO(d))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Расписание</h1>
        <Link to="/admin/records/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Новая запись
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => shift(-1)} className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-2 rounded-lg">←</button>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
        <button onClick={() => shift(1)} className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-2 rounded-lg">→</button>
        <button onClick={() => setDate(today)} className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-3 py-2 rounded-lg text-sm">Сегодня</button>
        <span className="text-gray-500 text-sm">{data?.count ?? 0} записей</span>
      </div>

      {isLoading ? (
        <div className="text-gray-500 text-center py-12">Загрузка...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {data?.results.map((r) => (
            <div key={r.id}
              className={`flex items-center gap-4 border rounded-xl px-4 py-3 ${STATUS_STYLE[r.status_title] ?? 'bg-gray-800/40 border-gray-700 text-gray-300'}`}>
              <div className="w-20 font-mono text-sm shrink-0">{r.record_start}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.client_last_name} {r.client_first_name} {r.client_father_name}</div>
                <div className="text-sm opacity-70">{r.doctor_name} · {r.chair_title}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-medium">{r.total.toLocaleString()} ₸</div>
                <div className="text-xs opacity-60">{r.payment_state_title}</div>
              </div>
              <div className="shrink-0 text-xs bg-black/20 px-2 py-1 rounded">{r.status_title}</div>
            </div>
          ))}
          {data?.results.length === 0 && (
            <div className="text-center text-gray-600 py-16">Записей на {date} нет</div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Шаг 3: Закоммитить**

```bash
git add frontend/src/api/records.ts frontend/src/pages/admin/Schedule.tsx
git commit -m "feat: страница расписания с навигацией по дате"
```

---

## Task 17: Форма новой записи

**Files:**
- Create: `frontend/src/api/doctors.ts`
- Create: `frontend/src/pages/admin/NewRecord.tsx`

- [ ] **Шаг 1: Создать frontend/src/api/doctors.ts**

```ts
import api from './client'

export interface Doctor {
  id: number
  first_name: string
  last_name: string
  father_name: string
  full_name: string
  services_id: number
}

export async function getDoctors(): Promise<Doctor[]> {
  const { data } = await api.get<{ results: Doctor[] }>('/doctors/')
  return data.results
}
```

- [ ] **Шаг 2: Создать frontend/src/pages/admin/NewRecord.tsx**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDoctors } from '../../api/doctors'
import { getPatients } from '../../api/patients'
import { createRecord } from '../../api/records'

export default function NewRecord() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    client: '', doctor: '', reception_day: today,
    record_start: today, record_end: today, notes: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: doctors }  = useQuery({ queryKey: ['doctors'],  queryFn: getDoctors })
  const { data: patients } = useQuery({ queryKey: ['patients', ''], queryFn: () => getPatients() })

  function set(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const selectedPatient = patients?.results.find((p) => String(p.id) === form.client)
      const selectedDoctor  = doctors?.find((d) => String(d.id) === form.doctor)
      await createRecord({
        ...form,
        client_first_name: selectedPatient?.first_name ?? '',
        client_last_name:  selectedPatient?.last_name  ?? '',
        client_father_name: selectedPatient?.father_name ?? '',
        doctors_name: selectedDoctor?.full_name ?? '',
        assistant_name: '',
        specialization: 1,
        tooth: 0, specialization_cost: 0, count: 1, sell: 0, total: 0,
        status: 1,
      })
      navigate('/admin/schedule')
    } catch {
      setError('Ошибка при создании записи.')
    } finally {
      setLoading(false)
    }
  }

  const field = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500'

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white mb-6">Новая запись</h1>
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Пациент</label>
            <select name="client" value={form.client} onChange={set} required className={field}>
              <option value="">Выберите пациента</option>
              {patients?.results.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Врач</label>
            <select name="doctor" value={form.doctor} onChange={set} required className={field}>
              <option value="">Выберите врача</option>
              {doctors?.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Дата приёма</label>
            <input type="date" name="reception_day" value={form.reception_day} onChange={set} required className={field} />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Время начала</label>
            <input type="date" name="record_start" value={form.record_start} onChange={set} required className={field} />
          </div>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Примечания</label>
          <textarea name="notes" value={form.notes} onChange={set} rows={3} className={`${field} resize-none`} />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            {loading ? 'Сохранение...' : 'Создать запись'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-6 py-2.5 rounded-lg transition-colors">
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Шаг 3: Закоммитить**

```bash
git add frontend/src/api/doctors.ts frontend/src/pages/admin/NewRecord.tsx
git commit -m "feat: форма создания новой записи на приём"
```

---

## Task 18: Финальная проверка Этапа 1

- [ ] **Шаг 1: Запустить все backend-тесты**

```bash
cd src && python manage.py test users doctors client records api -v 2
```

Ожидаемый результат: `OK` — все тесты проходят без ошибок

- [ ] **Шаг 2: Создать тестового суперпользователя**

```bash
cd src && python manage.py shell -c "
from users.models import User
u = User.objects.create_superuser('admin@clinic.kz', 'Admin123!', role='admin', first_name='Главный', last_name='Администратор')
print('Создан:', u.email)
"
```

- [ ] **Шаг 3: Запустить Django**

```bash
cd src && python manage.py runserver
```

- [ ] **Шаг 4: Запустить React (новый терминал)**

```bash
cd frontend && npm run dev
```

- [ ] **Шаг 5: Проверить в браузере**

Открыть `http://localhost:5173` и выполнить:
- Войти с `admin@clinic.kz` / `Admin123!`
- Убедиться что открывается расписание с сайдбаром
- Перейти в "Пациенты" — таблица загружается, поиск работает
- Перейти в "Новая запись" — форма с выпадающими списками открывается
- Нажать "Выйти" — редирект на /login

- [ ] **Шаг 6: Финальный коммит**

```bash
git add -A
git commit -m "feat: Этап 1 завершён — Django REST API + React SPA с JWT-авторизацией и тремя ролями"
```
