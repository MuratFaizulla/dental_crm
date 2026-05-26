from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, FamilyMember


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


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'father_name',
            'iin', 'date_of_birth', 'gender', 'mobile_phone',
            'oblast', 'address', 'language', 'avatar', 'role',
        ]
        read_only_fields = ['id', 'username', 'role', 'iin']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value: str) -> str:
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Ескі құпиясөз қате.')
        return value

    def validate_new_password(self, value: str) -> str:
        validate_password(value)
        return value

    def save(self) -> None:
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])


class ForgotPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()


class ResetPasswordSerializer(serializers.Serializer):
    username     = serializers.CharField()
    code         = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value: str) -> str:
        validate_password(value)
        return value

    def save(self) -> None:
        try:
            user = User.objects.get(username=self.validated_data['username'], is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError({'username': 'Пайдаланушы табылмады.'})
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])


class UserManagementSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'father_name',
            'email', 'mobile_phone', 'role', 'is_active', 'created_at', 'password',
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data: dict) -> User:
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        user.set_password(password) if password else user.set_unusable_password()
        user.save()
        return user

    def update(self, instance: User, validated_data: dict) -> User:
        validated_data.pop('password', None)
        return super().update(instance, validated_data)


class FamilyMemberSerializer(serializers.ModelSerializer):
    relation_label = serializers.CharField(source='get_relation_type_display', read_only=True)

    def validate_iin(self, value: str) -> str:
        if value and (not value.isdigit() or len(value) != 12):
            raise serializers.ValidationError('ЖСН 12 саннан тұруы керек.')
        return value

    class Meta:
        model = FamilyMember
        fields = [
            'id', 'relation_type', 'relation_label',
            'iin', 'last_name', 'first_name', 'father_name',
            'date_of_birth', 'gender', 'address',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'relation_label', 'created_at', 'updated_at']
