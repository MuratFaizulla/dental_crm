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
