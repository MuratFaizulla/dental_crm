from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.Serializer):
    iin          = serializers.CharField(max_length=12, min_length=12)
    username     = serializers.CharField(max_length=150)
    mobile_phone = serializers.CharField(max_length=15)
    password     = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate_iin(self, value: str) -> str:
        if not value.isdigit():
            raise serializers.ValidationError('ЖСН тек сандардан тұруы керек.')
        if User.objects.filter(iin=value).exists():
            raise serializers.ValidationError('Бұл ЖСН бойынша пайдаланушы тіркелген.')
        return value

    def validate_username(self, value: str) -> str:
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Бұл логин бос емес.')
        return value

    def validate(self, data: dict) -> dict:
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Құпиясөздер сәйкес келмейді.'})
        validate_password(data['password'])
        return data

    def create(self, validated_data: dict) -> User:
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        return User.objects.create_user(
            username=validated_data['username'],
            password=password,
            iin=validated_data['iin'],
            mobile_phone=validated_data['mobile_phone'],
            role=User.ROLE_PATIENT,
        )
