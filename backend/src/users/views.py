from django.core.exceptions import ObjectDoesNotExist
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from .models import User, FamilyMember
from .otp import generate_otp, verify_otp
from api.permissions import IsAdmin
from .serializers import (
    RegisterSerializer, ProfileSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, FamilyMemberSerializer,
    UserManagementSerializer,
)
from records.models import Record
from medical.models import PatientFile, TreatmentPlanItem
from medical.serializers import PatientFileSerializer, TreatmentPlanItemSerializer


class OTPRateThrottle(AnonRateThrottle):
    scope = 'otp'  # resolves to DEFAULT_THROTTLE_RATES['otp'] = '5/hour'


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({'detail': 'Тіркелу сәтті аяқталды.'}, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ProfileSerializer(request.user).data)

    def patch(self, request):
        ser = ProfileSerializer(request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def delete(self, request):
        request.user.is_active = False
        request.user.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({'detail': 'Құпиясөз өзгертілді.'})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPRateThrottle]

    def post(self, request):
        ser = ForgotPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        username = ser.validated_data['username']
        # Generate OTP only if user exists — always return same response to prevent enumeration
        if User.objects.filter(username=username, is_active=True).exists():
            generate_otp(username)
        return Response({'detail': 'SMS код жіберілді.'})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPRateThrottle, UserRateThrottle]

    def post(self, request):
        ser = ResetPasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        username = ser.validated_data['username']
        code = ser.validated_data['code']
        if not verify_otp(username, code):
            return Response(
                {'code': 'Код қате немесе мерзімі өтті.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ser.save()
        return Response({'detail': 'Құпиясөз жаңартылды.'})


class FamilyMemberViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FamilyMemberSerializer
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return FamilyMember.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserManagementView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.filter(
            role__in=[User.ROLE_ADMIN, User.ROLE_DOCTOR]
        ).order_by('-created_at')
        return Response(UserManagementSerializer(users, many=True).data)

    def post(self, request):
        ser = UserManagementSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    permission_classes = [IsAdmin]

    def _get(self, pk: int):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def patch(self, request, pk: int):
        user = self._get(pk)
        if not user:
            return Response({'detail': 'Не найдено.'}, status=status.HTTP_404_NOT_FOUND)
        ser = UserManagementSerializer(user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def delete(self, request, pk: int):
        user = self._get(pk)
        if not user:
            return Response({'detail': 'Не найдено.'}, status=status.HTTP_404_NOT_FOUND)
        if user.pk == request.user.pk:
            return Response({'detail': 'Нельзя деактивировать себя.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class SetPasswordView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk: int):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Не найдено.'}, status=status.HTTP_404_NOT_FOUND)
        new_password = request.data.get('new_password', '')
        if len(new_password) < 8:
            return Response(
                {'new_password': 'Минимум 8 символов.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(new_password)
        user.save(update_fields=['password'])
        return Response({'detail': 'Пароль обновлён.'})


def _get_client_profile(user):
    try:
        return user.client_profile
    except ObjectDoesNotExist:
        return None


class MyAppointmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = _get_client_profile(request.user)
        if client is None:
            return Response({'detail': 'Пациент профилі табылмады.'}, status=status.HTTP_404_NOT_FOUND)
        records = (
            Record.objects
            .filter(client=client)
            .select_related('status')
            .order_by('-reception_day')[:50]
        )
        data = [
            {
                'id': r.id,
                'reception_day': r.reception_day,
                'record_start': r.record_start,
                'doctors_name': r.doctors_name,
                'status': r.status.title if r.status else '',
                'total': r.total,
                'notes': r.notes,
            }
            for r in records
        ]
        return Response(data)


class MyFilesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = _get_client_profile(request.user)
        if client is None:
            return Response({'detail': 'Пациент профилі табылмады.'}, status=status.HTTP_404_NOT_FOUND)
        files = PatientFile.objects.filter(patient=client)
        ser = PatientFileSerializer(files, many=True, context={'request': request})
        return Response(ser.data)


class MyPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = _get_client_profile(request.user)
        if client is None:
            return Response({'detail': 'Пациент профилі табылмады.'}, status=status.HTTP_404_NOT_FOUND)
        items = TreatmentPlanItem.objects.filter(patient=client)
        ser = TreatmentPlanItemSerializer(items, many=True)
        return Response(ser.data)
