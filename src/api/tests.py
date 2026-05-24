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
        # Force authentication state for the test
        from rest_framework.test import force_authenticate
        force_authenticate(request, user=user)
        return view(request)

    def test_admin_can_access_admin_view(self):
        self.assertEqual(self._get(AdminOnlyView.as_view(), self.admin).status_code, 200)

    def test_doctor_cannot_access_admin_view(self):
        self.assertEqual(self._get(AdminOnlyView.as_view(), self.doctor).status_code, 403)

    def test_patient_cannot_access_admin_view(self):
        self.assertEqual(self._get(AdminOnlyView.as_view(), self.patient).status_code, 403)
