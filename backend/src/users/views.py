from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from .models import User, FamilyMember
from .otp import generate_otp, verify_otp
from .serializers import (
    RegisterSerializer, ProfileSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, FamilyMemberSerializer,
)


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
