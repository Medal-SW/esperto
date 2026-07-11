"""Tests for Google login: direct login, auto-link by email and auto-register."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth.google import GoogleUserInfo, suggest_username
from app.auth.service import create_access_token, hash_password
from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.users.repository import UserRepository

GOOGLE_INFO = GoogleUserInfo(sub="google-sub-123", email="fulano@gmail.com", name="Fulano Silva")


@pytest.fixture()
def db():
    # o TestClient roda a app em outra thread: StaticPool + check_same_thread=False
    # mantêm a mesma conexão sqlite compartilhada entre as threads
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db, monkeypatch):
    monkeypatch.setattr(settings, "google_client_id", "test-client-id")

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture()
def mock_verify(monkeypatch):
    monkeypatch.setattr(
        "app.auth.router.verify_google_credential", lambda credential: GOOGLE_INFO,
    )


def make_user(db, username="lucas", password="1234", google_id=None, email=None):
    repo = UserRepository(db)
    return repo.create(
        username=username,
        # email é NOT NULL: deriva um do username quando o teste não especifica
        email=email or f"{username}@example.com",
        password_hash=hash_password(password) if password else None,
        google_id=google_id,
    )


def me(client, token):
    return client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})


class TestPasswordLoginWithGoogleOnlyUser:
    def test_login_returns_401_not_500(self, client, db):
        make_user(db, username="googleonly", password=None, google_id="g-1", email="a@gmail.com")
        res = client.post("/api/auth/login", json={"login": "googleonly", "password": "x"})
        assert res.status_code == 401
        assert "login com Google" in res.json()["detail"]


class TestGoogleLogin:
    def test_known_sub_returns_token(self, client, db, mock_verify):
        user = make_user(db, google_id=GOOGLE_INFO.sub, email=GOOGLE_INFO.email)
        res = client.post("/api/auth/google", json={"credential": "fake"})
        assert res.status_code == 200
        body = res.json()
        assert body["created"] is False
        profile = me(client, body["access_token"])
        assert profile.status_code == 200
        assert profile.json()["id"] == user.id
        assert profile.json()["google_linked"] is True

    def test_invalid_credential_returns_401(self, client, db, monkeypatch):
        def raise_invalid(credential):
            raise ValueError("bad token")

        monkeypatch.setattr("app.auth.router.verify_google_credential", raise_invalid)
        res = client.post("/api/auth/google", json={"credential": "fake"})
        assert res.status_code == 401

    def test_not_configured_returns_503(self, client, db, monkeypatch):
        monkeypatch.setattr(settings, "google_client_id", "")
        res = client.post("/api/auth/google", json={"credential": "fake"})
        assert res.status_code == 503


class TestGoogleAutoLink:
    def test_matching_email_auto_links_and_returns_token(self, client, db, mock_verify):
        user = make_user(db, email=GOOGLE_INFO.email)
        res = client.post("/api/auth/google", json={"credential": "fake"})
        assert res.status_code == 200
        body = res.json()
        assert body["created"] is False
        profile = me(client, body["access_token"])
        assert profile.status_code == 200
        assert profile.json()["id"] == user.id
        assert profile.json()["google_linked"] is True
        assert profile.json()["has_password"] is True

    def test_email_match_is_case_insensitive(self, client, db, monkeypatch):
        user = make_user(db, email=GOOGLE_INFO.email)
        upper_info = GoogleUserInfo(
            sub=GOOGLE_INFO.sub, email="Fulano@GMAIL.com", name=GOOGLE_INFO.name,
        )
        monkeypatch.setattr(
            "app.auth.router.verify_google_credential", lambda credential: upper_info,
        )
        res = client.post("/api/auth/google", json={"credential": "fake"})
        assert res.status_code == 200
        assert res.json()["created"] is False
        db.refresh(user)
        assert user.google_id == GOOGLE_INFO.sub
        assert user.email == GOOGLE_INFO.email

    def test_email_owned_by_user_with_other_google_id_returns_409(
        self, client, db, mock_verify,
    ):
        make_user(db, google_id="outro-sub", email=GOOGLE_INFO.email)
        res = client.post("/api/auth/google", json={"credential": "fake"})
        assert res.status_code == 409


class TestGoogleAutoRegister:
    def test_new_email_creates_account_and_logs_in(self, client, db, mock_verify):
        res = client.post("/api/auth/google", json={"credential": "fake"})
        assert res.status_code == 200
        body = res.json()
        assert body["created"] is True
        user = UserRepository(db).get_by_username("fulano")
        assert user is not None
        assert user.password_hash is None
        assert user.google_id == GOOGLE_INFO.sub
        assert user.email == GOOGLE_INFO.email
        assert user.display_name == GOOGLE_INFO.name
        # conta nova precisa escolher username antes de usar o site
        assert user.is_onboarded is False
        profile = me(client, body["access_token"])
        assert profile.status_code == 200
        assert profile.json()["id"] == user.id
        assert profile.json()["is_onboarded"] is False

    def test_username_collision_gets_numeric_suffix(self, client, db, mock_verify):
        make_user(db, username="fulano")
        res = client.post("/api/auth/google", json={"credential": "fake"})
        assert res.status_code == 200
        assert res.json()["created"] is True
        assert UserRepository(db).get_by_username("fulano2") is not None

    def test_second_login_reuses_account(self, client, db, mock_verify):
        first = client.post("/api/auth/google", json={"credential": "fake"})
        assert first.json()["created"] is True
        second = client.post("/api/auth/google", json={"credential": "fake"})
        assert second.status_code == 200
        assert second.json()["created"] is False
        assert len(UserRepository(db).get_all()) == 1

    def test_short_local_part_falls_back_to_jogador(self, client, db, monkeypatch):
        info = GoogleUserInfo(sub="sub-ab", email="ab@gmail.com", name=None)
        monkeypatch.setattr(
            "app.auth.router.verify_google_credential", lambda credential: info,
        )
        res = client.post("/api/auth/google", json={"credential": "fake"})
        assert res.status_code == 200
        assert UserRepository(db).get_by_username("jogador") is not None


class TestSuggestUsername:
    def test_strips_invalid_chars_and_lowercases(self):
        assert suggest_username("Oliveira.Silva-P@gmail.com") == "oliveirasilvap"

    def test_short_local_part_falls_back(self):
        assert suggest_username("ab@gmail.com") == "jogador"


class TestCompleteOnboarding:
    def _new_google_token(self, client):
        res = client.post("/api/auth/google", json={"credential": "fake"})
        assert res.json()["created"] is True
        return res.json()["access_token"]

    def test_sets_username_and_marks_onboarded(self, client, db, mock_verify):
        token = self._new_google_token(client)
        res = client.post(
            "/api/auth/complete-onboarding",
            json={"username": "priscila"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["username"] == "priscila"
        assert body["is_onboarded"] is True
        assert UserRepository(db).get_by_username("priscila") is not None

    def test_collision_returns_409(self, client, db, mock_verify):
        make_user(db, username="priscila", email="outra@x.com")
        token = self._new_google_token(client)
        res = client.post(
            "/api/auth/complete-onboarding",
            json={"username": "priscila"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 409
        assert res.json()["detail"] == "Username já existe"

    def test_short_username_returns_422(self, client, db, mock_verify):
        token = self._new_google_token(client)
        res = client.post(
            "/api/auth/complete-onboarding",
            json={"username": "ab"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 422

    def test_already_onboarded_returns_409(self, client, db):
        user = make_user(db, username="jaexiste", email="ja@x.com")
        token = create_access_token(user.id)
        res = client.post(
            "/api/auth/complete-onboarding",
            json={"username": "outronome"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 409
        assert res.json()["detail"] == "Conta já finalizada"

    def test_requires_auth(self, client, db):
        res = client.post(
            "/api/auth/complete-onboarding", json={"username": "qualquer"},
        )
        assert res.status_code == 401


class TestGoogleConnect:
    def _auth(self, user):
        return {"Authorization": f"Bearer {create_access_token(user.id)}"}

    def test_connect_success(self, client, db, mock_verify):
        user = make_user(db)
        res = client.post(
            "/api/auth/google/connect", json={"credential": "fake"}, headers=self._auth(user),
        )
        assert res.status_code == 200
        assert res.json()["google_linked"] is True
        assert res.json()["email"] == GOOGLE_INFO.email

    def test_already_connected_returns_409(self, client, db, mock_verify):
        user = make_user(db, google_id="outro-sub", email="outro@gmail.com")
        res = client.post(
            "/api/auth/google/connect", json={"credential": "fake"}, headers=self._auth(user),
        )
        assert res.status_code == 409

    def test_sub_linked_to_other_user_returns_409(self, client, db, mock_verify):
        make_user(db, username="lucas", google_id=GOOGLE_INFO.sub, email=GOOGLE_INFO.email)
        user = make_user(db, username="marina")
        res = client.post(
            "/api/auth/google/connect", json={"credential": "fake"}, headers=self._auth(user),
        )
        assert res.status_code == 409

    def test_email_owned_by_other_user_returns_409(self, client, db, mock_verify):
        make_user(db, username="dona", email=GOOGLE_INFO.email)
        user = make_user(db, username="marina")
        res = client.post(
            "/api/auth/google/connect", json={"credential": "fake"}, headers=self._auth(user),
        )
        assert res.status_code == 409
        assert "e-mail" in res.json()["detail"]
