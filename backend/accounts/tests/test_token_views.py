"""
Tests for TokenObtainCookieView and TokenRefreshCookieView.

Covers:
  - Property 1:  Login bem-sucedido emite cookies seguros e retorna role/email
  - Property 2:  Expiração do Access Token (≤ 300s)
  - Property 3:  Expiração do Refresh Token (≤ 86400s)
  - Property 4:  Refresh round-trip emite novo access_token
  - Property 15: Atributos de segurança dos cookies em produção (DEBUG=False)
"""

from django.test import override_settings

import jwt
import pytest
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PASSWORD = "senha@Segura123"  # noqa: S105

ROLE_PARAMS = pytest.mark.parametrize(
    "role",
    ["admin", "editor", "reader"],
    ids=["admin", "editor", "reader"],
)


def _make_user(role: str):
    """Create an approved user with the given role using UserFactory traits."""
    if role == "admin":
        return UserFactory(admin=True)
    if role == "reader":
        return UserFactory(reader=True)
    return UserFactory()  # default is editor


def _login(client: APIClient, user) -> "rest_framework.response.Response":  # noqa: F821
    """POST /api/auth/token/ with the user's email and the shared password."""
    return client.post(
        "/api/auth/token/",
        data={"email": user.email, "password": PASSWORD},
        format="json",
    )


# ---------------------------------------------------------------------------
# Task 5.1 — Property 1: Login bem-sucedido emite cookies seguros e retorna role/email
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestTokenObtainView:
    """Validates Property 1: successful login emits HttpOnly cookies and returns role/email."""

    @ROLE_PARAMS
    def test_login_with_valid_credentials_returns_200(self, role):
        """POST /api/auth/token/ with valid credentials must return HTTP 200.

        Validates: Requirements 3.1
        """
        user = _make_user(role)
        client = APIClient()
        response = _login(client, user)

        assert response.status_code == 200, (
            f"Expected HTTP 200 for role={role!r}, got {response.status_code}. "
            f"Body: {response.data}"
        )

    @ROLE_PARAMS
    def test_login_sets_httponly_access_token_cookie(self, role):
        """Successful login must set an HttpOnly access_token cookie.

        Validates: Requirements 3.2
        """
        user = _make_user(role)
        client = APIClient()
        response = _login(client, user)

        assert response.status_code == 200
        assert (
            "access_token" in response.cookies
        ), "Expected 'access_token' cookie in response."
        assert response.cookies["access_token"][
            "httponly"
        ], "Expected 'access_token' cookie to have HttpOnly=True."

    @ROLE_PARAMS
    def test_login_sets_httponly_refresh_token_cookie(self, role):
        """Successful login must set an HttpOnly refresh_token cookie.

        Validates: Requirements 3.2
        """
        user = _make_user(role)
        client = APIClient()
        response = _login(client, user)

        assert response.status_code == 200
        assert (
            "refresh_token" in response.cookies
        ), "Expected 'refresh_token' cookie in response."
        assert response.cookies["refresh_token"][
            "httponly"
        ], "Expected 'refresh_token' cookie to have HttpOnly=True."

    @ROLE_PARAMS
    def test_login_response_body_contains_role_and_email(self, role):
        """Successful login response body must contain the correct role and email.

        Validates: Requirements 3.3
        """
        user = _make_user(role)
        client = APIClient()
        response = _login(client, user)

        assert response.status_code == 200
        assert (
            "role" in response.data
        ), f"Expected 'role' in response body, got: {response.data}"
        assert (
            "email" in response.data
        ), f"Expected 'email' in response body, got: {response.data}"
        assert (
            response.data["role"] == role
        ), f"Expected role={role!r}, got {response.data['role']!r}"
        assert (
            response.data["email"] == user.email
        ), f"Expected email={user.email!r}, got {response.data['email']!r}"

    @ROLE_PARAMS
    def test_login_response_body_does_not_contain_tokens(self, role):
        """Successful login response body must NOT expose access or refresh tokens.

        Validates: Requirements 3.4
        """
        user = _make_user(role)
        client = APIClient()
        response = _login(client, user)

        assert response.status_code == 200
        assert (
            "access" not in response.data
        ), "Access token must not appear in the response body."
        assert (
            "refresh" not in response.data
        ), "Refresh token must not appear in the response body."

    @ROLE_PARAMS
    def test_login_with_username_field_returns_400_or_401(self, role):
        """Login using 'username' field instead of 'email' must be rejected.

        Validates: Requirements 3.7
        """
        user = _make_user(role)
        client = APIClient()
        response = client.post(
            "/api/auth/token/",
            data={"username": user.email, "password": PASSWORD},
            format="json",
        )

        assert response.status_code in (400, 401), (
            f"Expected HTTP 400 or 401 when using 'username' field, "
            f"got {response.status_code}. "
            "The token endpoint must authenticate exclusively by the 'email' field."
        )


# ---------------------------------------------------------------------------
# Task 5.2 — Properties 2 & 3: Token expiry
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAccessTokenExpiry:
    """Validates Property 2: access_token lifetime is at most 300 seconds."""

    @ROLE_PARAMS
    def test_access_token_lifetime_is_at_most_300_seconds(self, role):
        """Decoded access_token must have exp - iat <= 300 seconds.

        Validates: Requirements 3.5
        """
        user = _make_user(role)
        client = APIClient()
        response = _login(client, user)

        assert response.status_code == 200
        raw_token = response.cookies["access_token"].value
        payload = jwt.decode(
            raw_token,
            options={"verify_signature": False},
            algorithms=["HS256"],
        )

        lifetime = payload["exp"] - payload["iat"]
        assert lifetime <= 300, (
            f"Access token lifetime {lifetime}s exceeds the 300s (5 min) maximum. "
            f"exp={payload['exp']}, iat={payload['iat']}"
        )


@pytest.mark.django_db
class TestRefreshTokenExpiry:
    """Validates Property 3: refresh_token lifetime is at most 86400 seconds."""

    @ROLE_PARAMS
    def test_refresh_token_lifetime_is_at_most_86400_seconds(self, role):
        """Decoded refresh_token must have exp - iat <= 86400 seconds.

        Validates: Requirements 3.6
        """
        user = _make_user(role)
        client = APIClient()
        response = _login(client, user)

        assert response.status_code == 200
        raw_token = response.cookies["refresh_token"].value
        payload = jwt.decode(
            raw_token,
            options={"verify_signature": False},
            algorithms=["HS256"],
        )

        lifetime = payload["exp"] - payload["iat"]
        assert lifetime <= 86400, (
            f"Refresh token lifetime {lifetime}s exceeds the 86400s (1 day) maximum. "
            f"exp={payload['exp']}, iat={payload['iat']}"
        )


# ---------------------------------------------------------------------------
# Task 5.3 — Property 4: Refresh round-trip
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestTokenRefreshView:
    """Validates Property 4: refresh round-trip emits a new access_token."""

    @ROLE_PARAMS
    def test_refresh_with_valid_cookie_returns_200(self, role):
        """POST /api/auth/token/refresh/ with a valid refresh_token cookie must return HTTP 200.

        Validates: Requirements 3.8
        """
        user = _make_user(role)
        login_client = APIClient()
        login_response = _login(login_client, user)

        assert login_response.status_code == 200
        refresh_cookie_value = login_response.cookies["refresh_token"].value
        assert (
            refresh_cookie_value
        ), "Expected a non-empty refresh_token cookie after login."

        refresh_client = APIClient()
        refresh_client.cookies["refresh_token"] = refresh_cookie_value
        refresh_response = refresh_client.post(
            "/api/auth/token/refresh/", format="json"
        )

        assert refresh_response.status_code == 200, (
            f"Expected HTTP 200 from token refresh endpoint for role={role!r}, "
            f"got {refresh_response.status_code}. Body: {refresh_response.data}"
        )

    @ROLE_PARAMS
    def test_refresh_response_sets_new_httponly_access_token(self, role):
        """Token refresh response must set a new HttpOnly access_token cookie.

        Validates: Requirements 3.8
        """
        user = _make_user(role)
        login_client = APIClient()
        login_response = _login(login_client, user)

        assert login_response.status_code == 200
        refresh_cookie_value = login_response.cookies["refresh_token"].value

        refresh_client = APIClient()
        refresh_client.cookies["refresh_token"] = refresh_cookie_value
        refresh_response = refresh_client.post(
            "/api/auth/token/refresh/", format="json"
        )

        assert refresh_response.status_code == 200
        assert (
            "access_token" in refresh_response.cookies
        ), "Expected a new 'access_token' cookie in the refresh response."
        assert refresh_response.cookies["access_token"][
            "httponly"
        ], "Expected the new 'access_token' cookie to have HttpOnly=True."
        assert refresh_response.cookies[
            "access_token"
        ].value, "Expected a non-empty new access_token cookie."


# ---------------------------------------------------------------------------
# Task 5.4 — Property 15: Cookie security attributes in production
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCookieSecurityAttributes:
    """Validates Property 15: cookies have Secure flag when DEBUG=False."""

    @ROLE_PARAMS
    def test_cookies_have_secure_flag_when_debug_is_false(self, role):
        """In production (DEBUG=False), cookies must have HttpOnly=True and Secure=True.

        Validates: Requirements 3.9
        """
        user = _make_user(role)
        client = APIClient()

        with override_settings(DEBUG=False):
            response = _login(client, user)

        assert response.status_code == 200

        for cookie_name in ("access_token", "refresh_token"):
            assert (
                cookie_name in response.cookies
            ), f"Expected '{cookie_name}' cookie in response."
            cookie = response.cookies[cookie_name]
            assert cookie[
                "httponly"
            ], f"Expected '{cookie_name}' cookie to have HttpOnly=True in production."
            assert cookie[
                "secure"
            ], f"Expected '{cookie_name}' cookie to have Secure=True when DEBUG=False."
