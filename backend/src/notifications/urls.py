from django.urls import path
from .views import SendSMSView, SMSLogListView

urlpatterns = [
    path('notifications/send/<int:record_id>/', SendSMSView.as_view(), name='sms-send'),
    path('notifications/log/', SMSLogListView.as_view(), name='sms-log'),
]
