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
