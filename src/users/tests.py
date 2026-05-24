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
