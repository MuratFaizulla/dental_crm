from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView

from api.permissions import IsAdminOrDoctor
from users.models import User
from .models import PatientFile
from .views import doctor_can_access_client


class PatientFileDownloadView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, pk):
        pf = get_object_or_404(
            PatientFile.objects.select_related('patient'),
            pk=pk,
        )
        client = pf.patient
        user = request.user

        if user.role == User.ROLE_DOCTOR and not doctor_can_access_client(user, client):
            raise Http404

        try:
            file_handle = pf.file.open('rb')
        except FileNotFoundError:
            raise Http404

        response = FileResponse(file_handle, as_attachment=True, filename=pf.file.name.split('/')[-1])
        response['Cache-Control'] = 'private, no-store'
        return response
