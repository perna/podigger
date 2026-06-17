"""Configuração global do pytest para a suite de testes do backend."""

import pytest
from accounts.tests.factories import UserFactory
from podcasts.tests.factories import EpisodeFactory, PodcastFactory
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def disable_throttling(mocker):
    """Suprime SimpleRateThrottle em todos os testes."""
    mocker.patch(
        "rest_framework.throttling.SimpleRateThrottle.allow_request",
        return_value=True,
    )


@pytest.fixture
def user_factory():
    return UserFactory


@pytest.fixture
def podcast_factory():
    return PodcastFactory


@pytest.fixture
def episode_factory():
    return EpisodeFactory


@pytest.fixture
def api_client():
    return APIClient()
