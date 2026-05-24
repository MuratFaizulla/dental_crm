from django.test import TestCase
from users.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken


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
        self.assertEqual(token['full_name'], 'Беков Ғани')
