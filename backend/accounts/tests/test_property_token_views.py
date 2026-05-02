# Feature: api-authentication-strategy, Property 1: Login bem-sucedido emite tokens e retorna role/email
"""
Property tests for TokenObtainCookieView and TokenRefreshCookieView.

Covers:
  - Property 1:  Login bem-sucedido emite tokens e retorna role/email
  - Property 2:  Expiração do Access Token
  - Property 3:  Expiração do Refresh Token
  - Property 4:  Autenticação por email
  - Property 5:  Renovação de token (round-trip)
  - Property 15: Atributos de segurança dos cookies
"""
import jwt
import pytest
from hypothesis import HealthCheck, given
from hypothesis import settings as hyp_settings
from hypothesis import strategies as st
from rest_framework.test import APIClient

from accounts.models import User

# ---------------------------------------------------------------------------
# Shared strategy helpers
# ---------------------------------------------------------------------------

# Use only lowercase emails to avoid normalization mismatches.
# Django's UserManager.normalize_email() lowercases the domain part, so
# "user@EXAMPLE.COM" is stored as "user@example.com". Sending the original
# mixed-case email in the login request would fail the lookup.
_email_strategy = st.emails().map(lambda e: e.lower())

_password_strategy = st.text(
    min_size=8,
    max_size=20,
    alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd")),
)

_role_strategy = st.sampled_from(["admin", "editor", "reader"])


def _make_approved_user(email: str, password: str, role: str = "editor") -> User:
    """Create (or recreate) an approved user in the database and return it.

    Deletes any existing user with the same email first to avoid unique
    constraint violations when Hypothesis replays a shrunk example.
    """
    User.objects.filter(email=email).delete()
    return User.objects.create_user(
        email=email,
        password=password,
        approval_status="approved",
        role=role,
    )


def _login(email: str, password: str) -> "rest_framework.response.Response":  # noqa: F821
    """POST /api/auth/token/ and return the response."""
    client = APIClient()
    return client.post(
        "/api/auth/token/",
        data={"email": email, "password": password},
        format="json",
    )


# ---------------------------------------------------------------------------
# Property 1: Login bem-sucedido emite tokens e retorna role/email
# ---------------------------------------------------------------------------

# Feature: api-authentication-strategy, Property 1: Login bem-sucedido emite tokens e retorna role/email
@pytest.mark.django_db(transaction=True)
@given(
    email=_email_strategy,
    password=_password_strategy,
    role=_role_strategy,
)
@hyp_settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow],
    deadline=None,
)
def test_property_1_successful_login_sets_cookies_and_returns_role_email(
    email, password, role
):
    """Property 1: Login bem-sucedido emite tokens e retorna role/email.

    For any approved user with valid email and password, a POST /api/auth/token/
    request must:
      - Return HTTP 200
      - Set HttpOnly cookies ``access_token`` and ``refresh_token``
      - Include ``role`` and ``email`` in the response body

    Validates: Requirements 1.1, 1.8
    """
    user = _make_approved_user(email, password, role)
    try:
        response = _login(email, password)

        assert response.status_code == 200, (
            f"Expected HTTP 200 for valid credentials, got {response.status_code}. "
            f"Response body: {response.data}"
        )

        # Cookies must be present
        assert "access_token" in response.cookies, (
            "Expected 'access_token' cookie in response, but it was absent."
        )
        assert "refresh_token" in response.cookies, (
            "Expected 'refresh_token' cookie in response, but it was absent."
        )

        # Cookies must be HttpOnly
        assert response.cookies["access_token"]["httponly"], (
            "Expected 'access_token' cookie to have HttpOnly=True."
        )
        assert response.cookies["refresh_token"]["httponly"], (
            "Expected 'refresh_token' cookie to have HttpOnly=True."
        )

        # Body must contain role and email (no tokens)
        assert "role" in response.data, (
            f"Expected 'role' in response body, got: {response.data}"
        )
        assert "email" in response.data, (
            f"Expected 'email' in response body, got: {response.data}"
        )
        assert response.data["role"] == role, (
            f"Expected role={role!r}, got {response.data['role']!r}"
        )
        assert response.data["email"] == email, (
            f"Expected email={email!r}, got {response.data['email']!r}"
        )

        # Tokens must NOT be in the body
        assert "access" not in response.data, (
            "Access token must not appear in the response body."
        )
        assert "refresh" not in response.data, (
            "Refresh token must not appear in the response body."
        )
    finally:
        user.delete()


# ---------------------------------------------------------------------------
# Property 2: Expiração do Access Token
# ---------------------------------------------------------------------------

# Feature: api-authentication-strategy, Property 2: Expiração do Access Token
@pytest.mark.django_db(transaction=True)
@given(
    email=_email_strategy,
    password=_password_strategy,
)
@hyp_settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow],
    deadline=None,
)
def test_property_2_access_token_expiry(email, password):
    """Property 2: Expiração do Access Token.

    For any successful login, the decoded ``access_token`` payload must have
    ``exp - iat <= 300`` seconds (5 minutes).

    Validates: Requirements 1.4
    """
    user = _make_approved_user(email, password)
    try:
        response = _login(email, password)
        assert response.status_code == 200

        raw_token = response.cookies["access_token"].value
        # Decode without verification to inspect claims (signature already
        # validated by the server when it was issued)
        payload = jwt.decode(
            raw_token,
            options={"verify_signature": False},
            algorithms=["HS256"],
        )

        exp = payload["exp"]
        iat = payload["iat"]
        lifetime = exp - iat

        assert lifetime <= 300, (
            f"Access token lifetime {lifetime}s exceeds the 300s (5 min) maximum. "
            f"exp={exp}, iat={iat}"
        )
    finally:
        user.delete()


# ---------------------------------------------------------------------------
# Property 3: Expiração do Refresh Token  [OPTIONAL]
# ---------------------------------------------------------------------------

# Feature: api-authentication-strategy, Property 3: Expiração do Refresh Token
@pytest.mark.django_db(transaction=True)
@given(
    email=_email_strategy,
    password=_password_strategy,
)
@hyp_settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow],
    deadline=None,
)
def test_property_3_refresh_token_expiry(email, password):
    """Property 3: Expiração do Refresh Token.

    For any successful login, the decoded ``refresh_token`` payload must have
    ``exp - iat <= 86400`` seconds (1 day).

    Validates: Requirements 1.5
    """
    user = _make_approved_user(email, password)
    try:
        response = _login(email, password)
        assert response.status_code == 200

        raw_token = response.cookies["refresh_token"].value
        payload = jwt.decode(
            raw_token,
            options={"verify_signature": False},
            algorithms=["HS256"],
        )

        exp = payload["exp"]
        iat = payload["iat"]
        lifetime = exp - iat

        assert lifetime <= 86400, (
            f"Refresh token lifetime {lifetime}s exceeds the 86400s (1 day) maximum. "
            f"exp={exp}, iat={iat}"
        )
    finally:
        user.delete()


# ---------------------------------------------------------------------------
# Property 4: Autenticação por email  [OPTIONAL]
# ---------------------------------------------------------------------------

# Feature: api-authentication-strategy, Property 4: Autenticação por email
@pytest.mark.django_db(transaction=True)
@given(
    email=_email_strategy,
    password=_password_strategy,
)
@hyp_settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow],
    deadline=None,
)
def test_property_4_authentication_by_email_only(email, password):
    """Property 4: Autenticação por email.

    For any approved user, login must work exclusively with the ``email``
    field as the identifier. A request using ``username`` instead of ``email``
    must be rejected with HTTP 400 or HTTP 401.

    Validates: Requirements 1.7
    """
    user = _make_approved_user(email, password)
    try:
        client = APIClient()

        # Attempt login using 'username' field instead of 'email'
        response = client.post(
            "/api/auth/token/",
            data={"username": email, "password": password},
            format="json",
        )

        assert response.status_code in (400, 401), (
            f"Expected HTTP 400 or 401 when using 'username' field instead of 'email', "
            f"but got {response.status_code}. "
            f"The token endpoint must authenticate exclusively by the 'email' field."
        )
    finally:
        user.delete()


# ---------------------------------------------------------------------------
# Property 5: Renovação de token (round-trip)  [OPTIONAL]
# ---------------------------------------------------------------------------

# Feature: api-authentication-strategy, Property 5: Renovação de token (round-trip)
@pytest.mark.django_db(transaction=True)
@given(
    email=_email_strategy,
    password=_password_strategy,
)
@hyp_settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow],
    deadline=None,
)
def test_property_5_token_refresh_round_trip(email, password):
    """Property 5: Renovação de token (round-trip).

    For any authenticated user with a valid, non-expired ``refresh_token``,
    a POST /api/auth/token/refresh/ request must return HTTP 200 and emit a
    new ``access_token`` via HttpOnly cookie.

    Validates: Requirements 2.1
    """
    user = _make_approved_user(email, password)
    try:
        # Step 1: Login to obtain the refresh_token cookie
        login_response = _login(email, password)
        assert login_response.status_code == 200

        refresh_cookie_value = login_response.cookies["refresh_token"].value
        assert refresh_cookie_value, "Expected a non-empty refresh_token cookie after login."

        # Step 2: Use the refresh_token cookie to obtain a new access_token
        client = APIClient()
        client.cookies["refresh_token"] = refresh_cookie_value

        refresh_response = client.post("/api/auth/token/refresh/", format="json")

        assert refresh_response.status_code == 200, (
            f"Expected HTTP 200 from token refresh endpoint, "
            f"got {refresh_response.status_code}. "
            f"Response body: {refresh_response.data}"
        )

        # A new access_token cookie must be set
        assert "access_token" in refresh_response.cookies, (
            "Expected a new 'access_token' cookie in the refresh response."
        )
        assert refresh_response.cookies["access_token"]["httponly"], (
            "Expected the new 'access_token' cookie to have HttpOnly=True."
        )

        new_access_token = refresh_response.cookies["access_token"].value
        assert new_access_token, "Expected a non-empty new access_token cookie."
    finally:
        user.delete()


# ---------------------------------------------------------------------------
# Property 15: Atributos de segurança dos cookies  [OPTIONAL]
# ---------------------------------------------------------------------------

# Feature: api-authentication-strategy, Property 15: Atributos de segurança dos cookies
@pytest.mark.django_db(transaction=True)
@given(
    email=_email_strategy,
    password=_password_strategy,
)
@hyp_settings(
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow],
    deadline=None,
)
def test_property_15_cookie_security_attributes_in_production(email, password):
    """Property 15: Atributos de segurança dos cookies.

    For any successful login in an environment with DEBUG=False, the
    ``access_token`` and ``refresh_token`` cookies must have HttpOnly=True
    and Secure=True.

    Validates: Requirements 7.1, 7.2
    """
    from django.test import override_settings

    user = _make_approved_user(email, password)
    try:
        # Use override_settings as a context manager to simulate DEBUG=False
        # without relying on a function-scoped fixture (incompatible with @given)
        with override_settings(DEBUG=False):
            response = _login(email, password)

        assert response.status_code == 200

        for cookie_name in ("access_token", "refresh_token"):
            assert cookie_name in response.cookies, (
                f"Expected '{cookie_name}' cookie in response."
            )
            cookie = response.cookies[cookie_name]

            assert cookie["httponly"], (
                f"Expected '{cookie_name}' cookie to have HttpOnly=True in production."
            )
            assert cookie["secure"], (
                f"Expected '{cookie_name}' cookie to have Secure=True when DEBUG=False."
            )
    finally:
        user.delete()
