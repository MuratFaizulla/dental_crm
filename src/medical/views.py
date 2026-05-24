from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from api.permissions import IsAdminOrDoctor
from client.models import Client
from records.models import Record
from .models import MedicalNote, ToothRecord, TreatmentPlanItem, PatientFile
from .serializers import (
    MedicalNoteSerializer, ToothRecordSerializer,
    TreatmentPlanItemSerializer, PatientFileSerializer,
)


class ClientAccessMixin:
    def get_client(self):
        client_id = self.kwargs['client_id']
        client = get_object_or_404(Client, pk=client_id)
        user = self.request.user
        if user.role == 'admin':
            return client
        if user.role == 'doctor':
            try:
                doctor = user.doctors_profile
            except Exception:
                raise PermissionDenied
            if (client.doctor == doctor or
                    Record.objects.filter(doctor=doctor, client=client).exists()):
                return client
        raise PermissionDenied


class MedicalNoteView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, client_id):
        client = self.get_client()
        note, _ = MedicalNote.objects.get_or_create(
            patient=client, defaults={'updated_by': request.user}
        )
        return Response(MedicalNoteSerializer(note).data)

    def put(self, request, client_id):
        client = self.get_client()
        note, _ = MedicalNote.objects.get_or_create(
            patient=client, defaults={'updated_by': request.user}
        )
        serializer = MedicalNoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)


class TeethListView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, client_id):
        client = self.get_client()
        teeth = ToothRecord.objects.filter(patient=client)
        return Response(ToothRecordSerializer(teeth, many=True).data)


class ToothDetailView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def put(self, request, client_id, tooth_number):
        client = self.get_client()
        tooth, _ = ToothRecord.objects.get_or_create(
            patient=client,
            tooth_number=tooth_number,
            defaults={'updated_by': request.user},
        )
        serializer = ToothRecordSerializer(tooth, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)


class PlanListView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, client_id):
        client = self.get_client()
        plan = TreatmentPlanItem.objects.filter(patient=client)
        return Response(TreatmentPlanItemSerializer(plan, many=True).data)

    def post(self, request, client_id):
        client = self.get_client()
        serializer = TreatmentPlanItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(patient=client, doctor=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PlanDetailView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def patch(self, request, client_id, pk):
        client = self.get_client()
        item = get_object_or_404(TreatmentPlanItem, pk=pk, patient=client)
        serializer = TreatmentPlanItemSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        if instance.status == 'done':
            ToothRecord.objects.update_or_create(
                patient=client,
                tooth_number=instance.tooth_number,
                defaults={'status': 'treated', 'updated_by': request.user},
            )
        return Response(serializer.data)

    def delete(self, request, client_id, pk):
        client = self.get_client()
        item = get_object_or_404(TreatmentPlanItem, pk=pk, patient=client)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FilesListView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, client_id):
        client = self.get_client()
        files = PatientFile.objects.filter(patient=client)
        return Response(PatientFileSerializer(files, many=True, context={'request': request}).data)

    def post(self, request, client_id):
        client = self.get_client()
        serializer = PatientFileSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(patient=client, uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FileDetailView(ClientAccessMixin, APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, client_id, pk):
        client = self.get_client()
        file = get_object_or_404(PatientFile, pk=pk, patient=client)
        return Response(PatientFileSerializer(file, context={'request': request}).data)

    def delete(self, request, client_id, pk):
        client = self.get_client()
        file = get_object_or_404(PatientFile, pk=pk, patient=client)
        file.file.delete(save=False)
        file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
