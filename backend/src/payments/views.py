import logging
from decimal import Decimal

from django.db.models import Count, F, Sum
from django.db.models.functions import Coalesce
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.permissions import IsAdmin, IsAdminOrDoctor
from records.models import Record
from .models import Payment
from .serializers import DebtRecordSerializer, PaymentSerializer

logger = logging.getLogger(__name__)


class PaymentViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PaymentSerializer

    def get_permissions(self):
        if self.action in ['debts', 'summary']:
            return [IsAdmin()]
        return [IsAdminOrDoctor()]

    def get_queryset(self):
        qs = Payment.objects.select_related('record', 'received_by').order_by('-paid_at')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        doctor = self.request.query_params.get('doctor')
        record_id = self.request.query_params.get('record')
        if date_from:
            qs = qs.filter(paid_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(paid_at__date__lte=date_to)
        if doctor:
            qs = qs.filter(record__doctor_id=doctor)
        if record_id:
            qs = qs.filter(record_id=record_id)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    @action(detail=False, methods=['get'], url_path='debts', permission_classes=[IsAdmin])
    def debts(self, request):
        qs = (
            Record.objects.select_related('doctor')
            .annotate(paid=Coalesce(Sum('payments__amount'), Decimal('0')))
            .filter(total__gt=F('paid'))
            .order_by('-reception_day')
        )
        serializer = DebtRecordSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='summary', permission_classes=[IsAdmin])
    def summary(self, request):
        qs = Payment.objects.all()
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(paid_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(paid_at__date__lte=date_to)

        agg = qs.aggregate(
            total=Coalesce(Sum('amount'), Decimal('0')),
            count=Count('id'),
        )
        by_type = list(
            qs.values('payment_type')
            .annotate(amount=Sum('amount'), count=Count('id'))
            .order_by('payment_type')
        )
        return Response({'total': agg['total'], 'count': agg['count'], 'by_type': by_type})
