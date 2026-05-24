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
