from typing import Self

import factory
from factory.django import DjangoModelFactory
from faker import Faker

from accounts.models import User

fake = Faker("pt_BR")


class UserFactory(DjangoModelFactory):
    """Factory para o modelo accounts.User."""

    class Meta:
        model = User
        django_get_or_create = ("email",)
        skip_postgeneration_save = True

    @classmethod
    def _after_postgeneration(
        cls: type[Self],
        instance: User,
        create: bool,
        results: dict | None = None,
    ) -> None:
        """Persist the instance after post-generation hooks.

        Required because ``set_password`` writes the password hash to the
        in-memory instance but not to the database row, so we need an
        explicit ``save()`` to persist it.
        """
        if create:
            instance.save()

    email = factory.LazyFunction(lambda: fake.unique.email())
    password = factory.PostGenerationMethodCall("set_password", "senha@Segura123")
    role = "editor"
    approval_status = "approved"

    class Params:
        # Traits para roles específicas
        admin = factory.Trait(role="admin")
        reader = factory.Trait(role="reader")
        pending = factory.Trait(approval_status="pending")
