# Health Check Endpoint for Django
# Add this to backend/podcasts/views.py or create a new health.py file

from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse


def health_check(_request):
    """Health check endpoint for monitoring.

    Returns 200 if all services are healthy, 503 otherwise.
    """
    health_status = {"status": "healthy", "checks": {}}

    status_code = 200

    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {e!s}"
        health_status["status"] = "unhealthy"
        status_code = 503

    # Check Redis/Cache
    try:
        cache.set("health_check", "ok", 10)
        if cache.get("health_check") == "ok":
            health_status["checks"]["cache"] = "healthy"
        else:
            health_status["checks"]["cache"] = "unhealthy: cache read failed"
            health_status["status"] = "unhealthy"
            status_code = 503
    except Exception as e:
        health_status["checks"]["cache"] = f"unhealthy: {e!s}"
        health_status["status"] = "unhealthy"
        status_code = 503

    return JsonResponse(health_status, status=status_code)
