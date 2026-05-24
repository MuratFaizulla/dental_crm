from django.contrib import admin
from .models import MedicalNote, ToothRecord, TreatmentPlanItem, PatientFile

admin.site.register(MedicalNote)
admin.site.register(ToothRecord)
admin.site.register(TreatmentPlanItem)
admin.site.register(PatientFile)
