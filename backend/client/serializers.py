from rest_framework import serializers
from .models import Client, Gender, FindOut


class GenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gender
        fields = ['id', 'gender_name']


class FindOutSerializer(serializers.ModelSerializer):
    class Meta:
        model = FindOut
        fields = ['id', 'find_out_name']


class ClientSerializer(serializers.ModelSerializer):
    full_name         = serializers.SerializerMethodField()
    gender_name       = serializers.CharField(source='gender.gender_name', read_only=True)
    find_out_name     = serializers.CharField(source='find_out.find_out_name', read_only=True)
    doctor_name       = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'first_name', 'last_name', 'father_name', 'full_name',
            'gender', 'gender_name', 'mobile_phone', 'iin', 'date_of_birth',
            'find_out', 'find_out_name', 'doctor', 'doctor_name', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_full_name(self, obj):
        return f'{obj.last_name} {obj.first_name} {obj.father_name}'.strip()

    def get_doctor_name(self, obj):
        if obj.doctor:
            return f'{obj.doctor.last_name} {obj.doctor.first_name}'
        return ''
