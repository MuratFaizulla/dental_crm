from django.urls import path
from .views import AdminDashboardView, DoctorDashboardView

urlpatterns = [
    path('dashboard/summary/', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('dashboard/doctor-summary/', DoctorDashboardView.as_view(), name='dashboard-doctor'),
]
