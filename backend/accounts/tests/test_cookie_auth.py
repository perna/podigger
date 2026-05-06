# Feature: api-authentication-strategy, Property 13: Token lido exclusivamente do cookie
"""
Property 13: Token lido exclusivamente do cookie

For any valid JWT token sent via `Authorization: Bearer <token>` header
(instead of the `access_token` cookie), the API must treat the request as
unauthenticated and return HTTP 401 for protected endpoints.

Validates: Requirements 4.1, 4.2, 4.3, 4.4
"""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.tests.factories import UserFactory


@pytest.mark.django_db
class TestCookieJWTAuthentication:
    """Verifica que o CookieJWTAuthentication rejeita tokens enviados via header Authorization."""

    @pytest.mark.parametrize(
        "role",
        ["editor", "admin"],
        ids=["editor", "admin"],
    )
    def test_token_via_authorization_header_returns_401(self, role):
        """Property 13: Token sent via Authorization header must be rejected (HTTP 401).

        The CookieJWTAuthentication backend reads the access token exclusively from
        the ``access_token`` HttpOnly cookie. Sending a valid JWT via the standard
        ``Authorization: Bearer <token>`` header must result in the request being
        treated as unauthenticated, and the protected endpoint must return HTTP 401.

        **Validates: Requirements 4.1**
        """
        # Create an approved user with the given role
        user = UserFactory(role=role)

        # Generate a real JWT access token for this user (no HTTP call needed)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        client = APIClient()

        # Send the valid token via Authorization header — NOT via cookie
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # POST /api/podcasts/ is a protected write endpoint
        response = client.post(
            "/api/podcasts/",
            data={"name": "Test Podcast", "feed": "https://example.com/feed.xml"},
            format="json",
        )

        # The API must treat this as unauthenticated and return 401
        assert response.status_code == 401, (
            f"Expected HTTP 401 when token is sent via Authorization header "
            f"(role={role!r}), but got {response.status_code}. "
            f"The CookieJWTAuthentication backend must read tokens exclusively "
            f"from the 'access_token' cookie, not from the Authorization header."
        )
