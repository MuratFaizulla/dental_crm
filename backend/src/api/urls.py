from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.jwt import CustomTokenObtainPairView
from api.views import ClinicSettingsView, ChairListView, ChairDetailView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include('users.urls')),
    path('', include('doctors.urls')),
    path('', include('client.urls')),
    path('', include('records.urls')),
    path('', include('medical.urls')),
    path('', include('payments.urls')),
    path('', include('dashboard.urls')),
    path('settings/clinic/', ClinicSettingsView.as_view(), name='clinic-settings'),
    path('settings/chairs/', ChairListView.as_view(), name='chair-list'),
    path('settings/chairs/<int:pk>/', ChairDetailView.as_view(), name='chair-detail'),
    path('', include('notifications.urls')),
    path('', include('reports.urls')),
]
