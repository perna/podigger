"""Global pytest configuration for the backend test suite."""
import os
from unittest.mock import patch

import pytest
from hypothesis import HealthCheck, settings

# ---------------------------------------------------------------------------
# Hypothesis profiles
# ---------------------------------------------------------------------------
# "ci" profile: fewer examples to keep CI fast (override via HYPOTHESIS_MAX_EXAMPLES)
# "default" profile: full exploration for local runs
_ci_max_examples = int(os.environ.get("HYPOTHESIS_MAX_EXAMPLES", 100))

settings.register_profile(
    "ci",
    max_examples=_ci_max_examples,
    suppress_health_check=[HealthCheck.too_slow],
    deadline=None,
)
settings.register_profile(
    "default",
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow],
    deadline=None,
)

# Activate CI profile when running in CI, default otherwise
if os.environ.get("CI"):
    settings.load_profile("ci")
else:
    settings.load_profile("default")


# ---------------------------------------------------------------------------
# Throttle suppression
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def disable_throttling():
    """Patch SimpleRateThrottle.allow_request to always return True in tests.

    Prevents HTTP 429 responses during property-based tests that make many
    requests in a short time window. The throttle classes are set directly on
    the views, so overriding DEFAULT_THROTTLE_CLASSES in settings is not
    sufficient — patching the base class method covers all throttle subclasses.
    """
    with patch(
        "rest_framework.throttling.SimpleRateThrottle.allow_request",
        return_value=True,
    ):
        yield
