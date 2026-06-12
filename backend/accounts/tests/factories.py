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

    email = factory.LazyFunction(lambda: fake.unique.email())
    password = factory.PostGenerationMethodCall("set_password", "senha@Segura123")
    role = "editor"
    approval_status = "approved"

    class Params:
        # Traits para roles específicas
        admin = factory.Trait(role="admin")
        reader = factory.Trait(role="reader")
        pending = factory.Trait(approval_status="pending")
