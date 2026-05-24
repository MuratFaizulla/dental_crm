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
