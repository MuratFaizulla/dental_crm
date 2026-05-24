from rest_framework import serializers
from .models import Doctors, Assistant, Specialization, Service


class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = ['id', 'title', 'cost']


class ServiceSerializer(serializers.ModelSerializer):
    spec_id = SpecializationSerializer(read_only=True)
    spec_id_id = serializers.PrimaryKeyRelatedField(
        queryset=Specialization.objects.all(), source='spec_id', write_only=True,
    )

    class Meta:
        model = Service
        fields = ['id', 'title', 'spec_id', 'spec_id_id']


class DoctorSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Doctors
        fields = ['id', 'first_name', 'last_name', 'father_name', 'full_name', 'body', 'services_id']

    def get_full_name(self, obj):
        return f'{obj.last_name} {obj.first_name} {obj.father_name}'.strip()


class AssistantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assistant
        fields = ['id', 'first_name', 'last_name', 'father_name', 'services_id']
