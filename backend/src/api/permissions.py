from rest_framework.permissions import BasePermission
from users.models import User


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.ROLE_ADMIN
        )


class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.ROLE_DOCTOR
        )


class IsPatient(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == User.ROLE_PATIENT
        )


class IsAdminOrDoctor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in (User.ROLE_ADMIN, User.ROLE_DOCTOR)
        )
