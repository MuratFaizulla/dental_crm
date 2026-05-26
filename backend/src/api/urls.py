from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.jwt import CustomTokenObtainPairView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include('users.urls')),
    path('', include('doctors.urls')),
    path('', include('client.urls')),
    path('', include('records.urls')),
    path('', include('medical.urls')),
    path('', include('payments.urls')),
]
