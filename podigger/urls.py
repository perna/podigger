from django.contrib import admin
from django.urls import path, include

admin.site.site_header = 'Podigger'

urlpatterns = [
    path('', include('web.urls')),
    path('admin/', admin.site.urls),
]
