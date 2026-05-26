import logging

from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response

from api.permissions import IsAdmin, IsAdminOrDoctor
from records.models import Record
from payments.models import Payment
from client.models import Client
from doctors.models import Doctors

logger = logging.getLogger(__name__)


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        today = timezone.localdate()
        month_start = today.replace(day=1)

        records_today = Record.objects.filter(reception_day=today)
        total_today = records_today.count()
        completed_today = records_today.filter(
            status__title__icontains='завершён'
        ).count()

        revenue_today = (
            Payment.objects.filter(paid_at__date=today)
            .aggregate(total=Sum('amount'))['total'] or 0
        )
        revenue_month = (
            Payment.objects.filter(paid_at__date__gte=month_start)
            .aggregate(total=Sum('amount'))['total'] or 0
        )

        new_patients_month = Client.objects.filter(
            created_at__date__gte=month_start
        ).count()

        # Долги: записи с total > 0 и без платежей
        unpaid_qs = Record.objects.filter(total__gt=0, payments__isnull=True)
        debt_count = unpaid_qs.count()
        debt_amount = unpaid_qs.aggregate(total=Sum('total'))['total'] or 0

        upcoming = (
            Record.objects.filter(
                reception_day=today,
                record_start__isnull=False,
            )
            .select_related('client', 'service')
            .order_by('record_start')[:5]
        )

        doctor_load = (
            Record.objects.filter(reception_day=today)
            .values('doctors_name')
            .annotate(
                total=Count('id'),
                done=Count('id', filter=Q(status__title__icontains='завершён')),
            )
            .order_by('doctors_name')
        )

        return Response({
            'records_today': total_today,
            'completed_today': completed_today,
            'revenue_today': float(revenue_today),
            'revenue_month': float(revenue_month),
            'new_patients_month': new_patients_month,
            'debt_count': debt_count,
            'debt_amount': float(debt_amount),
            'upcoming': [
                {
                    'id': r.id,
                    'time': r.record_start.strftime('%H:%M') if r.record_start else None,
                    'client': f'{r.client_last_name} {r.client_first_name}',
                    'service': r.service.title if r.service else '',
                    'doctor': r.doctors_name,
                }
                for r in upcoming
            ],
            'doctor_load': list(doctor_load),
        })


class DoctorDashboardView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request):
        today = timezone.localdate()
        month_start = today.replace(day=1)

        if request.user.role == 'doctor':
            try:
                doctor = Doctors.objects.get(user=request.user)
                qs_filter = Q(doctor=doctor)
                pay_filter = Q(record__doctor=doctor)
            except Doctors.DoesNotExist:
                qs_filter = Q(pk__in=[])
                pay_filter = Q(pk__in=[])
        else:
            qs_filter = Q()
            pay_filter = Q()

        records_today = Record.objects.filter(qs_filter, reception_day=today)
        total_today = records_today.count()
        completed_today = records_today.filter(
            status__title__icontains='завершён'
        ).count()

        revenue_today = (
            Payment.objects.filter(pay_filter, paid_at__date=today)
            .aggregate(total=Sum('amount'))['total'] or 0
        )
        revenue_month = (
            Payment.objects.filter(pay_filter, paid_at__date__gte=month_start)
            .aggregate(total=Sum('amount'))['total'] or 0
        )

        now = timezone.localtime()
        next_record = (
            records_today.filter(
                record_start__isnull=False,
                record_start__gt=now.time(),
            )
            .select_related('service')
            .order_by('record_start')
            .first()
        )

        today_list = (
            records_today.select_related('service', 'status')
            .order_by('record_start')[:20]
        )

        return Response({
            'records_today': total_today,
            'completed_today': completed_today,
            'revenue_today': float(revenue_today),
            'revenue_month': float(revenue_month),
            'next_patient': {
                'time': next_record.record_start.strftime('%H:%M') if next_record.record_start else None,
                'client': f'{next_record.client_last_name} {next_record.client_first_name}',
                'service': next_record.service.title if next_record.service else '',
            } if next_record else None,
            'today_list': [
                {
                    'id': r.id,
                    'time': r.record_start.strftime('%H:%M') if r.record_start else None,
                    'client': f'{r.client_last_name} {r.client_first_name}',
                    'service': r.service.title if r.service else '',
                    'status': r.status.title if r.status else '',
                }
                for r in today_list
            ],
        })
