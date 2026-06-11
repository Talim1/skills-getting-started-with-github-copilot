import copy
import pytest
from fastapi.testclient import TestClient
from src.app import app, activities


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset in-memory `activities` after each test to avoid state leakage."""
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)
