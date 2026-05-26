from rest_framework import serializers
from .models import Record, Status, ChairNum, RecordingType, PaymentType, PaymentState


class CalendarRecordSerializer(serializers.ModelSerializer):
    status_title = serializers.CharField(source='status.title', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    chair_title = serializers.SerializerMethodField()

    class Meta:
        model = Record
        fields = [
            'id',
            'client', 'client_first_name', 'client_last_name', 'client_father_name',
            'doctor', 'doctor_name',
            'chair', 'chair_title',
            'record_start', 'record_end', 'reception_day',
            'status', 'status_title',
        ]

    def get_doctor_name(self, obj: Record) -> str:
        if obj.doctor:
            return f'{obj.doctor.last_name} {obj.doctor.first_name}'
        return ''

    def get_chair_title(self, obj: Record) -> str:
        return obj.chair.title if obj.chair else ''


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ["id", "title"]


class ChairNumSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChairNum
        fields = ["id", "title"]


class RecordingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecordingType
        fields = ["id", "title"]


class PaymentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentType
        fields = ["id", "title"]


class PaymentStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentState
        fields = ["id", "title"]


class CheckConflictSerializer(serializers.Serializer):
    doctor = serializers.IntegerField()
    date = serializers.DateField()
    record_start = serializers.TimeField()
    record_end = serializers.TimeField()
    exclude_id = serializers.IntegerField(required=False, allow_null=True)


class RecordSerializer(serializers.ModelSerializer):
    status_title        = serializers.CharField(source="status.title", read_only=True)
    doctor_name         = serializers.SerializerMethodField()
    chair_title         = serializers.SerializerMethodField()
    payment_state_title = serializers.SerializerMethodField()

    class Meta:
        model = Record
        fields = [
            "id",
            "client", "client_first_name", "client_last_name", "client_father_name",
            "doctor", "doctor_name", "assistant", "assistant_name",
            "service", "specialization", "tooth",
            "specialization_cost", "count", "sell", "total",
            "registration_date", "record_start", "record_end", "reception_day",
            "recording_type", "notes", "reason",
            "chair", "chair_title",
            "payment_type", "payment_state", "payment_state_title",
            "status", "status_title",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate(self, data):
        start = data.get('record_start')
        end = data.get('record_end')
        if start and end and start >= end:
            raise serializers.ValidationError(
                {'record_end': 'Время окончания должно быть позже времени начала.'}
            )
        return data

    def get_doctor_name(self, obj):
        if obj.doctor:
            return f"{obj.doctor.last_name} {obj.doctor.first_name}"
        return ""

    def get_chair_title(self, obj):
        return obj.chair.title if obj.chair else ""

    def get_payment_state_title(self, obj):
        return obj.payment_state.title if obj.payment_state else ""
