from rest_framework import viewsets, filters
from api.permissions import IsAdmin, IsAdminOrDoctor
from .models import Client, Gender, FindOut
from .serializers import ClientSerializer, GenderSerializer, FindOutSerializer


class GenderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Gender.objects.all()
    serializer_class = GenderSerializer
    permission_classes = [IsAdminOrDoctor]


class FindOutViewSet(viewsets.ModelViewSet):
    queryset = FindOut.objects.all()
    serializer_class = FindOutSerializer
    permission_classes = [IsAdmin]


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('gender', 'find_out', 'doctor').order_by('-created_at')
    serializer_class = ClientSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'father_name', 'mobile_phone', 'iin']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrDoctor()]
        return [IsAdmin()]
