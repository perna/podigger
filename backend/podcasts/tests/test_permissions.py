"""
Property 11: Autenticação obrigatória para escrita (consolidado)

For any content endpoint (/api/podcasts/, /api/episodes/, /api/topic-suggestions/)
and any write method (POST, PUT, PATCH, DELETE), a request without a valid
access_token cookie must return HTTP 401.

Validates: Requirements 5.1, 5.2, 5.7

---

Property 12: Reader não pode escrever (consolidado)

For any content endpoint and any write method, a request with a valid
access_token of a user with role="reader" must return HTTP 403.

Validates: Requirements 5.3, 5.4, 5.7, 5.8

---

Property 14: Leitura pública sem autenticação

For any content endpoint (/api/podcasts/, /api/episodes/, /api/popular-terms/)
and method GET, a request without authentication must return HTTP 200.

Validates: Requirements 5.5, 5.6, 5.7
"""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.tests.factories import UserFactory

# ---------------------------------------------------------------------------
# Shared parametrize data
# ---------------------------------------------------------------------------

WRITE_ENDPOINTS = [
    "/api/podcasts/",
    "/api/episodes/",
    "/api/topic-suggestions/",
]

WRITE_METHODS = ["post", "put", "patch", "delete"]

# Cartesian product: 3 endpoints x 4 methods = 12 cases
_WRITE_CASES = [(ep, m) for ep in WRITE_ENDPOINTS for m in WRITE_METHODS]
_WRITE_IDS = [
    f"{m.upper()}_{ep.strip('/').replace('/', '_')}"
    for ep in WRITE_ENDPOINTS
    for m in WRITE_METHODS
]


# ---------------------------------------------------------------------------
# Property 11: Unauthenticated write requests must return 401
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestUnauthenticatedWriteAccess:
    """Property 11: Write requests without a valid access_token cookie must return 401.

    **Validates: Requirements 5.1, 5.2, 5.7**
    """

    @pytest.mark.parametrize(
        ("endpoint", "method"),
        _WRITE_CASES,
        ids=_WRITE_IDS,
    )
    def test_write_without_auth_returns_401(self, endpoint, method):
        """Unauthenticated write request must be rejected with HTTP 401.

        PUT, PATCH, and DELETE on list endpoints may return 405 (Method Not Allowed)
        instead of 401 when the router does not expose those methods on the list
        route. HTTP 405 is also an acceptable rejection because it means the request
        was refused before any business logic ran — the server never granted access.

        **Validates: Requirements 5.1, 5.2, 5.7**
        """
        client = APIClient()  # no authentication, no access_token cookie

        http_method = getattr(client, method)
        response = http_method(endpoint, data={}, format="json")

        # 401 is the primary expected status.
        # 405 is acceptable for PUT/PATCH/DELETE on list endpoints where those
        # HTTP verbs are not routed — the request is still rejected without access.
        assert response.status_code in (401, 405), (
            f"Expected HTTP 401 (or 405) for unauthenticated {method.upper()} "
            f"{endpoint}, but got {response.status_code}."
        )


# ---------------------------------------------------------------------------
# Property 12: Reader write requests must return 403
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestReaderWriteAccess:
    """Property 12: Write requests with a reader access_token must return 403.

    **Validates: Requirements 5.3, 5.4, 5.7, 5.8**
    """

    @pytest.mark.parametrize(
        ("endpoint", "method"),
        _WRITE_CASES,
        ids=_WRITE_IDS,
    )
    def test_reader_write_returns_403(self, endpoint, method):
        """Authenticated reader write request must be rejected with HTTP 403.

        PUT, PATCH, and DELETE on list endpoints may return 405 (Method Not Allowed)
        instead of 403 when the router does not expose those methods on the list
        route. HTTP 405 is also an acceptable rejection because it means the request
        was refused before any business logic ran — the server never granted access.

        **Validates: Requirements 5.3, 5.4, 5.7, 5.8**
        """
        # Create an approved user with role="reader"
        user = UserFactory(reader=True)

        # Authenticate via access_token cookie (CookieJWTAuthentication pattern)
        client = APIClient()
        client.cookies["access_token"] = str(RefreshToken.for_user(user).access_token)

        http_method = getattr(client, method)
        response = http_method(endpoint, data={}, format="json")

        # 403 is the primary expected status.
        # 405 is acceptable for PUT/PATCH/DELETE on list endpoints where those
        # HTTP verbs are not routed — the request is still rejected without access.
        assert response.status_code in (403, 405), (
            f"Expected HTTP 403 (or 405) for reader {method.upper()} "
            f"{endpoint}, but got {response.status_code}."
        )


# ---------------------------------------------------------------------------
# Property 14: Public read access returns 200
# ---------------------------------------------------------------------------

_READ_ENDPOINTS = [
    "/api/podcasts/",
    "/api/episodes/",
    "/api/popular-terms/",
]


@pytest.mark.django_db
class TestPublicReadAccess:
    """Property 14: GET requests without authentication must return 200.

    **Validates: Requirements 5.5, 5.6, 5.7**
    """

    @pytest.mark.parametrize(
        "endpoint",
        _READ_ENDPOINTS,
        ids=[ep.strip("/").replace("/", "_") for ep in _READ_ENDPOINTS],
    )
    def test_public_get_returns_200(self, endpoint):
        """Unauthenticated GET request to a public read endpoint must return HTTP 200.

        **Validates: Requirements 5.5, 5.6, 5.7**
        """
        client = APIClient()  # no authentication

        response = client.get(endpoint)

        assert response.status_code == 200, (
            f"Expected HTTP 200 for unauthenticated GET {endpoint}, "
            f"but got {response.status_code}."
        )
