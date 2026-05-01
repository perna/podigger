from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """JWT authentication that reads the access token from the HttpOnly cookie
    ``access_token`` instead of the ``Authorization`` header.

    Returning ``None`` when the cookie is absent allows unauthenticated
    (public) access to endpoints that permit it, without raising an exception.
    """

    def authenticate(self, request):
        raw_token = request.COOKIES.get("access_token")
        if raw_token is None:
            return None
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
