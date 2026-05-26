from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, MeView, ChangePasswordView,
    ForgotPasswordView, ResetPasswordView, FamilyMemberViewSet,
    UserManagementView, UserDetailView, SetPasswordView,
)

router = DefaultRouter()
router.register('family', FamilyMemberViewSet, basename='family')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('users/me/', MeView.as_view(), name='users-me'),
    path('users/me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('users/', UserManagementView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/set-password/', SetPasswordView.as_view(), name='user-set-password'),
    path('', include(router.urls)),
]
