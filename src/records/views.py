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
