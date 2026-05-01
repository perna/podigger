from django.conf import settings
from django.db import IntegrityError
from rest_framework import generics, status
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.models import User
from accounts.permissions import IsAdminRole
from accounts.serializers import RegisterSerializer, UserSerializer


class TokenObtainCookieView(TokenObtainPairView):
    """JWT login view that stores tokens in HttpOnly cookies instead of the response body.

    Inherits from TokenObtainPairView and delegates credential validation to
    EmailTokenObtainPairSerializer (configured via SIMPLE_JWT["TOKEN_OBTAIN_SERIALIZER"]).
    The serializer handles:
      - Authentication by email field
      - Raising AuthenticationFailed for invalid credentials
      - Raising PermissionDenied for accounts with approval_status="pending"

    On success, this view:
      - Sets access_token cookie (HttpOnly, 5 min, path="/")
      - Sets refresh_token cookie (HttpOnly, 1 day, path="/api/auth/token/refresh/")
      - Returns only {"role": "...", "email": "..."} in the response body

    On failure:
      - Returns HTTP 401 with {"detail": "Credenciais inválidas."} for invalid credentials
      - Returns HTTP 403 with {"detail": "Sua conta aguarda aprovação de um administrador."} for pending accounts
    """

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
        except PermissionDenied:
            return Response(
                {"detail": "Sua conta aguarda aprovação de um administrador."},
                status=status.HTTP_403_FORBIDDEN,
            )
        except (AuthenticationFailed, Exception) as exc:
            # AuthenticationFailed covers invalid credentials (wrong email/password)
            # We catch it here to return a consistent Portuguese error message
            # and ensure the status code is always 401 for auth failures.
            if isinstance(exc, AuthenticationFailed):
                return Response(
                    {"detail": "Credenciais inválidas."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            raise

        access_token = response.data.get("access")
        refresh_token = response.data.get("refresh")
        role = response.data.get("role")
        email = response.data.get("email")

        secure = not settings.DEBUG

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=secure,
            samesite="Lax",
            max_age=300,
            path="/",
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=secure,
            samesite="Lax",
            max_age=86400,
            path="/api/auth/token/refresh/",
        )

        # Return only role and email — tokens are in HttpOnly cookies
        response.data = {"role": role, "email": email}

        return response


class TokenRefreshCookieView(TokenRefreshView):
    """JWT token refresh view that reads the refresh token from an HttpOnly cookie
    and issues a new access token as an HttpOnly cookie.

    Inherits from TokenRefreshView and overrides ``post()`` to:
      - Read the ``refresh_token`` cookie instead of the request body
      - Return HTTP 401 when the cookie is absent, expired, or invalid
      - Set a new ``access_token`` HttpOnly cookie on success
      - Return HTTP 200 with an empty body on success (token is in the cookie)

    Cookie attributes:
      - HttpOnly=True
      - Secure=True when not DEBUG
      - SameSite=Lax
      - Max-Age=300 (5 minutes, matching ACCESS_TOKEN_LIFETIME)
      - Path=/
    """

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "Token de autenticação não fornecido ou inválido."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Inject the refresh token into request.data so the parent serializer
        # can validate it normally.
        request.data["refresh"] = refresh_token

        try:
            response = super().post(request, *args, **kwargs)
        except (InvalidToken, TokenError):
            return Response(
                {"detail": "Token de autenticação expirado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        new_access_token = response.data.get("access")

        secure = not settings.DEBUG

        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=secure,
            samesite="Lax",
            max_age=300,
            path="/",
        )

        # Return empty body — the new access token is in the HttpOnly cookie
        response.data = {}

        return response


class RegisterView(generics.CreateAPIView):
    """Public endpoint for user registration.

    Accepts POST /api/auth/register/ without authentication.
    Creates a new account with approval_status="pending" and role="reader".

    On success:
      - Returns HTTP 201 with {"email": "..."} in the response body

    On failure:
      - Returns HTTP 400 with {"detail": "A senha deve ter no mínimo 8 caracteres."} for short passwords
      - Returns HTTP 400 with {"detail": "Este email já está cadastrado."} for duplicate emails
    """

    serializer_class = RegisterSerializer
    permission_classes = []
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as exc:
            # Re-raise validation errors (e.g. short password) as-is
            raise

        try:
            self.perform_create(serializer)
        except IntegrityError:
            return Response(
                {"detail": "Este email já está cadastrado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"email": serializer.data.get("email")},
            status=status.HTTP_201_CREATED,
        )


class UserListView(generics.ListAPIView):
    """List all users. Restricted to Admin role.

    GET /api/auth/users/
    Returns HTTP 403 for non-Admin users.
    """

    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]
    queryset = User.objects.all().order_by("created_at")


class UserApproveView(APIView):
    """Approve a user account. Restricted to Admin role.

    POST /api/auth/users/{pk}/approve/
    Sets approval_status to "approved" and returns HTTP 200 with user data.
    Returns HTTP 403 for non-Admin users.
    Returns HTTP 404 if user not found.
    """

    permission_classes = [IsAdminRole]

    def post(self, request, pk, *args, **kwargs):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "Usuário não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.approval_status = "approved"
        user.save()

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserRoleUpdateView(APIView):
    """Update a user's role. Restricted to Admin role.

    PATCH /api/auth/users/{pk}/
    Accepts {"role": "..."} in the request body.
    Validates that role is one of ("admin", "editor", "reader").
    Returns HTTP 400 with descriptive message for invalid role.
    Returns HTTP 403 for non-Admin users.
    Returns HTTP 404 if user not found.
    """

    VALID_ROLES = ("admin", "editor", "reader")

    permission_classes = [IsAdminRole]

    def patch(self, request, pk, *args, **kwargs):
        role = request.data.get("role")

        if role not in self.VALID_ROLES:
            return Response(
                {"detail": "Papel inválido. Valores aceitos: admin, editor, reader."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "Usuário não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.role = role
        user.save()

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
