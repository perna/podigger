# Feature: api-authentication-strategy, Property 11: Autenticação obrigatória para escrita (consolidado)
# Feature: api-authentication-strategy, Property 12: Reader não pode escrever (consolidado)
# Feature: api-authentication-strategy, Property 14: Leitura pública sem autenticação
"""
Property 11: Autenticação obrigatória para escrita (consolidado)

For any content endpoint (/api/podcasts/, /api/episodes/, /api/topic-suggestions/)
and any write method (POST, PUT, PATCH, DELETE), a request without a valid
access_token cookie must return HTTP 401.

Validates: Requirements 5.1, 5.4

---

Property 12: Reader não pode escrever (consolidado)

For any content endpoint and any write method, a request with a valid
access_token of a user with role="reader" must return HTTP 403.

Validates: Requirements 5.2, 5.5

---

Property 14: Leitura pública sem autenticação

For any content endpoint (/api/podcasts/, /api/episodes/, /api/popular-terms/)
and method GET, a request without authentication must return HTTP 200.

Validates: Requirements 6.1, 6.2, 6.3, 6.4
"""

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from podcasts.models import Podcast

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_user(
    email: str, password: str, role: str, approval_status: str = "approved"
) -> User:
    return User.objects.create_user(
        email=email,
        password=password,
        role=role,
        approval_status=approval_status,
    )


def _cookie_client_for(user: User) -> APIClient:
    """Return an APIClient with the access_token cookie set for the given user."""
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    client = APIClient()
    client.cookies["access_token"] = access_token
    return client


# ---------------------------------------------------------------------------
# Property 11: Unauthenticated write requests must return 401
# ---------------------------------------------------------------------------

_WRITE_ENDPOINTS = [
    "/api/podcasts/",
    "/api/episodes/",
    "/api/topic-suggestions/",
]

_WRITE_METHODS = ["post", "put", "patch", "delete"]


@pytest.mark.django_db(transaction=True)
@given(
    email=st.emails(),
    password=st.text(
        min_size=8,
        max_size=20,
        alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd")),
    ),
    endpoint=st.sampled_from(_WRITE_ENDPOINTS),
    method=st.sampled_from(_WRITE_METHODS),
)
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow], deadline=None)
def test_unauthenticated_write_returns_401(email, password, endpoint, method):
    """Property 11: Write requests without a valid access_token cookie must return 401.

    Validates: Requirements 5.1, 5.4
    """
    client = APIClient()  # no authentication

    http_method = getattr(client, method)
    response = http_method(endpoint, data={}, format="json")

    assert response.status_code == 401, (
        f"Expected HTTP 401 for unauthenticated {method.upper()} {endpoint}, "
        f"but got {response.status_code}."
    )


# ---------------------------------------------------------------------------
# Property 12: Reader write requests must return 403
# ---------------------------------------------------------------------------


@pytest.mark.django_db(transaction=True)
@given(
    email=st.emails(),
    password=st.text(
        min_size=8,
        max_size=20,
        alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd")),
    ),
    endpoint=st.sampled_from(_WRITE_ENDPOINTS),
    method=st.sampled_from(_WRITE_METHODS),
)
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow], deadline=None)
def test_reader_write_returns_403(email, password, endpoint, method):
    """Property 12: Write requests with a reader access_token must return 403.

    Validates: Requirements 5.2, 5.5
    """
    user = _make_user(email, password, role="reader")
    client = _cookie_client_for(user)

    http_method = getattr(client, method)
    response = http_method(endpoint, data={}, format="json")

    assert response.status_code == 403, (
        f"Expected HTTP 403 for reader {method.upper()} {endpoint}, "
        f"but got {response.status_code}."
    )

    # Clean up to avoid unique constraint violations across hypothesis examples
    user.delete()


# ---------------------------------------------------------------------------
# Property 14: Public read access returns 200
# ---------------------------------------------------------------------------

_READ_ENDPOINTS = [
    "/api/podcasts/",
    "/api/episodes/",
    "/api/popular-terms/",
]


@pytest.mark.django_db(transaction=True)
@given(
    endpoint=st.sampled_from(_READ_ENDPOINTS),
)
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow], deadline=None)
def test_public_read_returns_200(endpoint):
    """Property 14: GET requests without authentication must return 200.

    Validates: Requirements 6.1, 6.2, 6.3, 6.4
    """
    client = APIClient()  # no authentication

    # Seed at least one podcast so list endpoints return data
    podcast = Podcast.objects.create(
        name="Public Podcast", feed="https://feed.example.com"
    )

    response = client.get(endpoint)

    assert response.status_code == 200, (
        f"Expected HTTP 200 for unauthenticated GET {endpoint}, "
        f"but got {response.status_code}."
    )

    # Clean up
    podcast.delete()
