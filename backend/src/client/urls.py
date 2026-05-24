from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, GenderViewSet, FindOutViewSet

router = DefaultRouter()
router.register('clients', ClientViewSet, basename='client')
router.register('genders', GenderViewSet, basename='gender')
router.register('find-outs', FindOutViewSet, basename='find-out')

urlpatterns = router.urls
