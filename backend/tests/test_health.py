from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

CORS_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"
    assert data["mode"] == "local"


def test_cors_allows_desktop_origin():
    for origin in CORS_ORIGINS:
        response = client.options(
            "/health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == origin, (
            f"Expected CORS origin {origin}"
        )


def test_cors_rejects_unlisted_origin():
    response = client.options(
        "/health",
        headers={
            "Origin": "https://evil.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    allow_origin = response.headers.get("access-control-allow-origin", "")
    assert allow_origin not in CORS_ORIGINS or allow_origin == ""


def test_cors_headers_on_get():
    for origin in CORS_ORIGINS:
        response = client.get("/health", headers={"Origin": origin})
        assert response.headers.get("access-control-allow-origin") == origin
