from __future__ import annotations

from typing import ClassVar

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models


class UserManager(BaseUserManager):
    """Custom manager for the User model using email as the unique identifier."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with the given email and password.

        Sets approval_status to 'pending' and role to 'reader' by default.
        """
        if not email:
            msg = "The Email field must be set"
            raise ValueError(msg)
        email = self.normalize_email(email)
        extra_fields.setdefault("approval_status", "pending")
        extra_fields.setdefault("role", "reader")
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with the given email and password.

        Sets is_staff, is_superuser, approval_status='approved', role='admin'.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("approval_status", "approved")
        extra_fields.setdefault("role", "admin")

        if extra_fields.get("is_staff") is not True:
            msg = "Superuser must have is_staff=True."
            raise ValueError(msg)
        if extra_fields.get("is_superuser") is not True:
            msg = "Superuser must have is_superuser=True."
            raise ValueError(msg)

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model using email as the unique identifier instead of username."""

    ROLE_CHOICES: ClassVar = [
        ("admin", "Admin"),
        ("editor", "Editor"),
        ("reader", "Reader"),
    ]

    APPROVAL_STATUS_CHOICES: ClassVar = [
        ("pending", "Pending"),
        ("approved", "Approved"),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="reader",
    )
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default="pending",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar = []

    objects = UserManager()

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        """Return the user's email as the string representation."""
        return self.email
