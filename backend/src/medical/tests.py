from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from doctors.models import Doctors, Service, Specialization
from client.models import Client, Gender, FindOut
from .models import MedicalNote, ToothRecord, TreatmentPlanItem, PatientFile
import os
from django.core.files.uploadedfile import SimpleUploadedFile


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
