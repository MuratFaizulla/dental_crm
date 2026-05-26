from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from api.permissions import IsAdmin, IsAdminOrDoctor
from .models import Record, Status, ChairNum, RecordingType, PaymentType, PaymentState
from .serializers import (
    RecordSerializer, CalendarRecordSerializer, CheckConflictSerializer,
    StatusSerializer, ChairNumSerializer,
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
        client_id = self.request.query_params.get('client_id')
        if reception_day:
            qs = qs.filter(reception_day=reception_day)
        if doctor:
            qs = qs.filter(doctor_id=doctor)
        if client_id:
            qs = qs.filter(client=client_id)
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'calendar', 'slots']:
            return [IsAdminOrDoctor()]
        return [IsAdmin()]

    @action(detail=False, methods=['get'], url_path='calendar')
    def calendar(self, request):
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        doctor = request.query_params.get('doctor')
        chair = request.query_params.get('chair')

        qs = Record.objects.select_related(
            'client', 'doctor', 'chair', 'status',
        ).order_by('reception_day', 'record_start')

        if date_from:
            qs = qs.filter(reception_day__gte=date_from)
        if date_to:
            qs = qs.filter(reception_day__lte=date_to)
        if doctor:
            qs = qs.filter(doctor_id=doctor)
        if chair:
            qs = qs.filter(chair_id=chair)

        serializer = CalendarRecordSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='slots')
    def slots(self, request):
        doctor_id = request.query_params.get('doctor')
        date = request.query_params.get('date')

        if not doctor_id or not date:
            return Response(
                {'detail': 'Параметры doctor и date обязательны.'},
                status=400,
            )

        qs = Record.objects.filter(
            doctor_id=doctor_id,
            reception_day=date,
        ).values('id', 'record_start', 'record_end')

        return Response(list(qs))

    @action(detail=False, methods=['post'], url_path='check-conflict')
    def check_conflict(self, request):
        ser = CheckConflictSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        qs = Record.objects.filter(
            doctor_id=d['doctor'],
            reception_day=d['date'],
            record_start__lt=d['record_end'],
            record_end__gt=d['record_start'],
        )
        if d.get('exclude_id'):
            qs = qs.exclude(id=d['exclude_id'])

        return Response({'conflict': qs.exists()})


class StatusViewSet(viewsets.ModelViewSet):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrDoctor()]
        return [IsAdmin()]


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
