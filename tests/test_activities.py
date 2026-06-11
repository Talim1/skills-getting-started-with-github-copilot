import urllib.parse


def test_root_redirect(client):
    # Arrange
    # Act
    response = client.get("/", follow_redirects=False)
    # Assert
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities(client):
    # Arrange
    # Act
    response = client.get("/activities")
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data


def test_signup_success(client):
    # Arrange
    email = "test@example.com"
    path = "/activities/" + urllib.parse.quote("Chess Club") + "/signup"
    # Act
    response = client.post(path, params={"email": email})
    # Assert
    assert response.status_code == 200
    assert f"Signed up {email}" in response.json().get("message", "")


def test_signup_duplicate(client):
    # Arrange
    email = "michael@mergington.edu"
    path = "/activities/" + urllib.parse.quote("Chess Club") + "/signup"
    # Act
    response = client.post(path, params={"email": email})
    # Assert
    assert response.status_code == 400


def test_signup_invalid_activity(client):
    # Arrange
    path = "/activities/" + urllib.parse.quote("NonExistent") + "/signup"
    # Act
    response = client.post(path, params={"email": "test@example.com"})
    # Assert
    assert response.status_code == 404


def test_remove_participant(client):
    # Arrange
    email = "michael@mergington.edu"
    path = "/activities/" + urllib.parse.quote("Chess Club") + "/participants"
    # Act
    response = client.delete(path, params={"email": email})
    # Assert
    assert response.status_code == 200
    assert f"Removed {email}" in response.json().get("message", "")
