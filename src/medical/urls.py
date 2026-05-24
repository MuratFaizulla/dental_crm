from django.urls import path
from . import views

urlpatterns = [
    path('medical/<int:client_id>/note/', views.MedicalNoteView.as_view()),
    path('medical/<int:client_id>/teeth/', views.TeethListView.as_view()),
    path('medical/<int:client_id>/teeth/<str:tooth_number>/', views.ToothDetailView.as_view()),
    path('medical/<int:client_id>/plan/', views.PlanListView.as_view()),
    path('medical/<int:client_id>/plan/<int:pk>/', views.PlanDetailView.as_view()),
    path('medical/<int:client_id>/files/', views.FilesListView.as_view()),
    path('medical/<int:client_id>/files/<int:pk>/', views.FileDetailView.as_view()),
]
