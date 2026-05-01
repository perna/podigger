from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import User


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that authenticates by email and enforces approval_status."""

    username_field = User.USERNAME_FIELD  # "email"

    @classmethod
    def get_token(cls, user):
        """Add role and email claims to the JWT payload."""
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token

    def validate(self, attrs):
        """Validate credentials and check approval_status before issuing tokens."""
        # Verify credentials first (raises AuthenticationFailed on invalid creds)
        data = super().validate(attrs)

        # After successful credential check, enforce approval_status
        if self.user.approval_status != "approved":
            raise PermissionDenied(
                "Sua conta aguarda aprovação de um administrador."
            )

        # Add role and email to the response body
        data["role"] = self.user.role
        data["email"] = self.user.email

        return data


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for public user registration."""

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "password"]

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError(
                "A senha deve ter no mínimo 8 caracteres."
            )
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            approval_status="pending",
            role="reader",
        )


class UserSerializer(serializers.ModelSerializer):
    """Read-only serializer for user data."""

    class Meta:
        model = User
        fields = ["id", "email", "role", "approval_status", "created_at"]
        read_only_fields = ["id", "email", "role", "approval_status", "created_at"]
