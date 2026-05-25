from rest_framework import serializers
from .models import MedicalNote, ToothRecord, TreatmentPlanItem, PatientFile


class MedicalNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalNote
        fields = ['anamnesis', 'allergies', 'notes', 'updated_at', 'updated_by']
        read_only_fields = ['updated_at', 'updated_by']


class ToothRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToothRecord
        fields = ['tooth_number', 'tooth_type', 'status', 'notes', 'updated_at', 'updated_by']
        read_only_fields = ['updated_at', 'updated_by']


class TreatmentPlanItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentPlanItem
        fields = [
            'id', 'tooth_number', 'diagnosis', 'treatment', 'service',
            'due_date', 'status', 'postpone_reason', 'linked_record',
            'doctor', 'created_at',
        ]
        read_only_fields = ['doctor', 'created_at']


class PatientFileSerializer(serializers.ModelSerializer):
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'pdf', 'dcm'}

    def validate_file(self, value):
        ext = value.name.rsplit('.', 1)[-1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f'Недопустимый формат. Разрешены: {", ".join(self.ALLOWED_EXTENSIONS)}'
            )
        if value.size > 20 * 1024 * 1024:
            raise serializers.ValidationError('Размер файла превышает 20 МБ.')
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        url = f'/api/v1/medical/files/{instance.id}/download/'
        data['file'] = request.build_absolute_uri(url) if request else url
        return data

    class Meta:
        model = PatientFile
        fields = [
            'id', 'file', 'file_type', 'description',
            'tooth_number', 'linked_record', 'uploaded_by', 'uploaded_at',
        ]
        read_only_fields = ['uploaded_by', 'uploaded_at']
