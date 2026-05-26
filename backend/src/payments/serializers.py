from decimal import Decimal

from rest_framework import serializers

from records.models import Record
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    received_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'record', 'amount', 'payment_type',
            'paid_at', 'received_by', 'received_by_name', 'notes',
        ]
        read_only_fields = ['paid_at']

    def get_received_by_name(self, obj: Payment) -> str:
        if obj.received_by:
            return f'{obj.received_by.last_name} {obj.received_by.first_name}'.strip()
        return ''

    def create(self, validated_data: dict) -> Payment:
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data.setdefault('received_by', request.user)
        return super().create(validated_data)


class DebtRecordSerializer(serializers.ModelSerializer):
    paid = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    debt = serializers.SerializerMethodField()
    client_full_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Record
        fields = [
            'id', 'client', 'client_full_name',
            'doctor', 'doctor_name',
            'reception_day', 'total', 'paid', 'debt',
        ]

    def get_debt(self, obj: Record) -> Decimal:
        paid = getattr(obj, 'paid', Decimal('0'))
        return Decimal(obj.total) - paid

    def get_client_full_name(self, obj: Record) -> str:
        return f'{obj.client_last_name} {obj.client_first_name}'.strip()

    def get_doctor_name(self, obj: Record) -> str:
        if obj.doctor:
            return f'{obj.doctor.last_name} {obj.doctor.first_name}'.strip()
        return ''


class SummarySerializer(serializers.Serializer):
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    count = serializers.IntegerField()
    by_type = serializers.ListField(child=serializers.DictField())
