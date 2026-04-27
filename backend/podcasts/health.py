"""Health check endpoint for monitoring."""

from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse


def health_check(_request):
    """Health check endpoint for monitoring.

    Returns HTTP 200 if the database is reachable (required dependency).
    Redis/cache issues are reported as "degraded" but do not fail the check,
    because the service can still operate without cache during startup.
    Returns HTTP 503 only when the database is unreachable.
    """
    health_status = {"status": "healthy", "checks": {}}
    status_code = 200

    # Database is a hard dependency — fail with 503 if unreachable
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {e!s}"
        health_status["status"] = "unhealthy"
        status_code = 503

    # Redis/Cache is a soft dependency — report degraded but keep HTTP 200
    # so that startup health checks pass even if Redis is still initializing.
    try:
        cache.set("health_check", "ok", 10)
        if cache.get("health_check") == "ok":
            health_status["checks"]["cache"] = "healthy"
        else:
            health_status["checks"]["cache"] = "degraded: cache read failed"
            if health_status["status"] == "healthy":
                health_status["status"] = "degraded"
    except Exception as e:
        health_status["checks"]["cache"] = f"degraded: {e!s}"
        if health_status["status"] == "healthy":
            health_status["status"] = "degraded"

    return JsonResponse(health_status, status=status_code)
