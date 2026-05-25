from rest_framework import viewsets
from api.permissions import IsAdmin, IsAdminOrDoctor
from .models import Doctors, Assistant, Specialization, Service
from .serializers import DoctorSerializer, AssistantSerializer, SpecializationSerializer, ServiceSerializer


class SpecializationViewSet(viewsets.ModelViewSet):
    queryset = Specialization.objects.order_by('title')
    serializer_class = SpecializationSerializer
    permission_classes = [IsAdminOrDoctor]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related('spec_id').order_by('title')
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminOrDoctor]


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctors.objects.select_related('services_id').order_by('last_name', 'first_name')
    serializer_class = DoctorSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrDoctor()]
        return [IsAdmin()]


class AssistantViewSet(viewsets.ModelViewSet):
    queryset = Assistant.objects.order_by('last_name', 'first_name')
    serializer_class = AssistantSerializer
    permission_classes = [IsAdminOrDoctor]
