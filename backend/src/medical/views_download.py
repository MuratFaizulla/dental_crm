from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView

from api.permissions import IsAdminOrDoctor
from records.models import Record
from users.models import User
from .models import PatientFile


class PatientFileDownloadView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request, pk):
        pf = get_object_or_404(
            PatientFile.objects.select_related('patient'),
            pk=pk,
        )
        client = pf.patient
        user = request.user

        if user.role == User.ROLE_DOCTOR:
            try:
                doctor = user.doctors_profile
            except Exception:
                raise Http404
            if not (
                client.doctor_id == doctor.pk
                or Record.objects.filter(doctor_id=doctor.pk, client_id=client.pk).exists()
            ):
                raise Http404

        try:
            file_handle = pf.file.open('rb')
        except FileNotFoundError:
            raise Http404

        response = FileResponse(file_handle, as_attachment=False)
        response['Cache-Control'] = 'private, no-store'
        return response
