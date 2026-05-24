from rest_framework.routers import DefaultRouter
from .views import (
    RecordViewSet, StatusViewSet, ChairNumViewSet,
    RecordingTypeViewSet, PaymentTypeViewSet, PaymentStateViewSet,
)

router = DefaultRouter()
router.register("records", RecordViewSet, basename="record")
router.register("statuses", StatusViewSet, basename="status")
router.register("chairs", ChairNumViewSet, basename="chair")
router.register("recording-types", RecordingTypeViewSet, basename="recording-type")
router.register("payment-types", PaymentTypeViewSet, basename="payment-type")
router.register("payment-states", PaymentStateViewSet, basename="payment-state")

urlpatterns = router.urls
