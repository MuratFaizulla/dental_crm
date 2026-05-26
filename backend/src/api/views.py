import logging

from rest_framework import serializers as drf_serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response

from api.permissions import IsAdmin
from api.models import ClinicSettings
from records.models import ChairNum

logger = logging.getLogger(__name__)


class ClinicSettingsSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = ClinicSettings
        fields = ['id', 'name', 'address', 'phone', 'email', 'working_hours', 'updated_at']
        read_only_fields = ['id', 'updated_at']


class ChairSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = ChairNum
        fields = ['id', 'title', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClinicSettingsView(APIView):
    permission_classes = [IsAdmin]

    def _get_instance(self):
        obj, _ = ClinicSettings.objects.get_or_create(pk=1)
        return obj

    def get(self, request):
        return Response(ClinicSettingsSerializer(self._get_instance()).data)

    def put(self, request):
        ser = ClinicSettingsSerializer(self._get_instance(), data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class ChairListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(ChairSerializer(ChairNum.objects.all().order_by('title'), many=True).data)

    def post(self, request):
        ser = ChairSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)


class ChairDetailView(APIView):
    permission_classes = [IsAdmin]

    def _get(self, pk):
        try:
            return ChairNum.objects.get(pk=pk)
        except ChairNum.DoesNotExist:
            return None

    def patch(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return Response({'detail': 'Не найдено.'}, status=status.HTTP_404_NOT_FOUND)
        ser = ChairSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def delete(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return Response({'detail': 'Не найдено.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
