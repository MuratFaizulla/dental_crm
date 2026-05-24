from rest_framework import serializers
from .models import Record, Status, ChairNum, RecordingType, PaymentType, PaymentState


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


class RecordSerializer(serializers.ModelSerializer):
    status_title        = serializers.CharField(source="status.title", read_only=True)
    doctor_name         = serializers.SerializerMethodField()
    chair_title         = serializers.CharField(source="chair.title", read_only=True, default="")
    payment_state_title = serializers.CharField(source="payment_state.title", read_only=True, default="")

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

    def get_doctor_name(self, obj):
        if obj.doctor:
            return f"{obj.doctor.last_name} {obj.doctor.first_name}"
        return ""
