import io
import logging
from decimal import Decimal

from django.db.models import Count, F, Q, Sum
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions import IsAdmin
from client.models import Client
from notifications.models import SMSLog
from payments.models import Payment
from records.models import Record

logger = logging.getLogger(__name__)

REPORT_TYPES = {
    'revenue_by_doctor',
    'revenue_by_service',
    'chair_load',
    'new_vs_returning',
    'top_ltv',
    'debts',
    'campaigns',
}

_XLSX_HEADERS = {
    'revenue_by_doctor':  ['Врач', 'Выручка (₸)', 'Платежей'],
    'revenue_by_service': ['Услуга', 'Выручка (₸)', 'Платежей'],
    'chair_load':         ['Кабинет', 'Записей'],
    'new_vs_returning':   ['Тип пациентов', 'Количество'],
    'top_ltv':            ['Пациент', 'LTV (₸)', 'Визитов'],
    'debts':              ['Пациент', 'Долг (₸)', 'Запись №'],
    'campaigns':          ['Тип кампании', 'Отправлено', 'Всего'],
}
_XLSX_KEYS = {
    'revenue_by_doctor':  ['name', 'revenue', 'records'],
    'revenue_by_service': ['name', 'revenue', 'records'],
    'chair_load':         ['name', 'records'],
    'new_vs_returning':   ['name', 'records'],
    'top_ltv':            ['name', 'revenue', 'records'],
    'debts':              ['name', 'revenue', 'records'],
    'campaigns':          ['name', 'revenue', 'records'],
}


class ReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, report_type: str):
        if report_type not in REPORT_TYPES:
            return Response({'detail': 'Неизвестный тип отчёта'}, status=404)

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        fmt = request.query_params.get('format', 'json')

        data = self._dispatch(report_type, date_from, date_to)

        if fmt == 'xlsx':
            return self._xlsx_response(report_type, data)
        return Response(data)

    def _dispatch(self, report_type: str, date_from, date_to) -> list:
        dispatch = {
            'revenue_by_doctor':  self._revenue_by_doctor,
            'revenue_by_service': self._revenue_by_service,
            'chair_load':         self._chair_load,
            'new_vs_returning':   self._new_vs_returning,
            'top_ltv':            lambda df, dt: self._top_ltv(),
            'debts':              lambda df, dt: self._debts(),
            'campaigns':          self._campaigns,
        }
        return dispatch[report_type](date_from, date_to)

    def _payment_qs(self, date_from, date_to):
        qs = Payment.objects.all()
        if date_from:
            qs = qs.filter(paid_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(paid_at__date__lte=date_to)
        return qs

    def _record_qs(self, date_from, date_to):
        qs = Record.objects.all()
        if date_from:
            qs = qs.filter(reception_day__gte=date_from)
        if date_to:
            qs = qs.filter(reception_day__lte=date_to)
        return qs

    def _revenue_by_doctor(self, date_from, date_to) -> list:
        rows = (
            self._payment_qs(date_from, date_to)
            .values('record__doctors_name')
            .annotate(revenue=Sum('amount'), records=Count('id'))
            .order_by('-revenue')
        )
        return [
            {
                'name': r['record__doctors_name'] or 'Не указан',
                'revenue': float(r['revenue'] or 0),
                'records': r['records'],
            }
            for r in rows
        ]

    def _revenue_by_service(self, date_from, date_to) -> list:
        rows = (
            self._payment_qs(date_from, date_to)
            .values('record__service__title')
            .annotate(revenue=Sum('amount'), records=Count('id'))
            .order_by('-revenue')
        )
        return [
            {
                'name': r['record__service__title'] or 'Без услуги',
                'revenue': float(r['revenue'] or 0),
                'records': r['records'],
            }
            for r in rows
        ]

    def _chair_load(self, date_from, date_to) -> list:
        rows = (
            self._record_qs(date_from, date_to)
            .values('chair__title')
            .annotate(records=Count('id'))
            .order_by('-records')
        )
        return [
            {
                'name': r['chair__title'] or 'Без кабинета',
                'records': r['records'],
                'revenue': 0,
            }
            for r in rows
        ]

    def _new_vs_returning(self, date_from, date_to) -> list:
        period_ids = set(
            self._record_qs(date_from, date_to)
            .values_list('client_id', flat=True)
            .distinct()
        )
        before_qs = Record.objects.filter(client_id__in=period_ids)
        if date_from:
            before_qs = before_qs.filter(reception_day__lt=date_from)
        returning_ids = set(before_qs.values_list('client_id', flat=True).distinct())
        return [
            {'name': 'Новые пациенты', 'records': len(period_ids - returning_ids), 'revenue': 0},
            {'name': 'Повторные пациенты', 'records': len(returning_ids), 'revenue': 0},
        ]

    def _top_ltv(self) -> list:
        clients = (
            Client.objects
            .annotate(
                ltv_total=Coalesce(Sum('record__payments__amount'), Decimal('0')),
                visit_count=Count('record', distinct=True),
            )
            .order_by('-ltv_total')[:20]
        )
        return [
            {
                'name': f'{c.last_name} {c.first_name}',
                'revenue': float(c.ltv_total),
                'records': c.visit_count,
            }
            for c in clients
        ]

    def _debts(self) -> list:
        records = (
            Record.objects
            .annotate(paid=Coalesce(Sum('payments__amount'), Decimal('0')))
            .filter(total__gt=0)
            .filter(paid__lt=F('total'))
            .select_related('client')
            .order_by('-reception_day')[:50]
        )
        return [
            {
                'name': (
                    f'{r.client_last_name} {r.client_first_name}'
                    if r.client else 'Удалён'
                ),
                'revenue': float(r.total) - float(r.paid),
                'records': r.id,
            }
            for r in records
        ]

    def _campaigns(self, date_from, date_to) -> list:
        qs = SMSLog.objects.all()
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        rows = (
            qs.values('sms_type')
            .annotate(
                total=Count('id'),
                sent=Count('id', filter=Q(status__in=['sent', 'delivered'])),
            )
            .order_by('sms_type')
        )
        return [
            {'name': r['sms_type'], 'revenue': r['sent'], 'records': r['total']}
            for r in rows
        ]

    def _xlsx_response(self, report_type: str, data: list) -> HttpResponse:
        try:
            import openpyxl
        except ImportError:
            return HttpResponse('openpyxl не установлен', status=500)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = report_type
        ws.append(_XLSX_HEADERS.get(report_type, ['Имя', 'Значение']))
        keys = _XLSX_KEYS.get(report_type, ['name', 'revenue'])
        for row in data:
            ws.append([row.get(k, '') for k in keys])

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        response = HttpResponse(
            buf.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="{report_type}.xlsx"'
        return response
