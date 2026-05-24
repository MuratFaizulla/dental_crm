from rest_framework.routers import DefaultRouter
from .views import DoctorViewSet, AssistantViewSet, SpecializationViewSet, ServiceViewSet

router = DefaultRouter()
router.register('doctors', DoctorViewSet, basename='doctor')
router.register('assistants', AssistantViewSet, basename='assistant')
router.register('specializations', SpecializationViewSet, basename='specialization')
router.register('services', ServiceViewSet, basename='service')

urlpatterns = router.urls
