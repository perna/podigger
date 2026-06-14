from django.urls import path

from accounts.views import (
    RegisterView,
    TokenObtainCookieView,
    TokenRefreshCookieView,
    UserApproveView,
    UserListView,
    UserRoleUpdateView,
)

urlpatterns = [
    path("token", TokenObtainCookieView.as_view(), name="token_obtain"),
    path("token/refresh", TokenRefreshCookieView.as_view(), name="token_refresh"),
    path("register/", RegisterView.as_view(), name="register"),
    path("users/", UserListView.as_view(), name="user_list"),
    path("users/<int:pk>/approve/", UserApproveView.as_view(), name="user_approve"),
    path("users/<int:pk>/", UserRoleUpdateView.as_view(), name="user_update"),
]
