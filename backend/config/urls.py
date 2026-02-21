from django.contrib import admin
from django.urls import include, path

from podcasts.health import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("podcasts.urls")),
    path("health/", health_check, name="health_check"),
]
