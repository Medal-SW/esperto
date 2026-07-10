"""Tests for signup with required email."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.users.repository import UserRepository


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
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def signup(client, username="lucas", email="lucas@gmail.com", password="1234"):
    return client.post(
        "/api/auth/signup",
        json={"username": username, "email": email, "password": password},
    )


class TestSignup:
    def test_signup_stores_email_lowercase(self, client, db):
        res = signup(client, email="Fulano@GMAIL.com")
        assert res.status_code == 201
        assert res.json()["email"] == "fulano@gmail.com"
        assert UserRepository(db).get_by_email("fulano@gmail.com") is not None

    def test_duplicate_email_returns_409(self, client, db):
        assert signup(client).status_code == 201
        res = signup(client, username="marina")
        assert res.status_code == 409
        assert res.json()["detail"] == "E-mail já cadastrado"

    def test_duplicate_email_different_case_returns_409(self, client, db):
        assert signup(client).status_code == 201
        res = signup(client, username="marina", email="LUCAS@gmail.com")
        assert res.status_code == 409

    def test_missing_email_returns_422(self, client, db):
        res = client.post(
            "/api/auth/signup", json={"username": "lucas", "password": "1234"},
        )
        assert res.status_code == 422

    def test_malformed_email_returns_422(self, client, db):
        res = signup(client, email="not-an-email")
        assert res.status_code == 422

    def test_duplicate_username_returns_409(self, client, db):
        assert signup(client).status_code == 201
        res = signup(client, email="outro@gmail.com")
        assert res.status_code == 409
        assert res.json()["detail"] == "Username já existe"


class TestLogin:
    def test_login_with_username(self, client, db):
        assert signup(client).status_code == 201
        res = client.post(
            "/api/auth/login", json={"login": "lucas", "password": "1234"},
        )
        assert res.status_code == 200
        assert res.json()["access_token"]

    def test_login_with_email(self, client, db):
        assert signup(client).status_code == 201
        res = client.post(
            "/api/auth/login", json={"login": "lucas@gmail.com", "password": "1234"},
        )
        assert res.status_code == 200
        assert res.json()["access_token"]

    def test_login_wrong_password_returns_401(self, client, db):
        assert signup(client).status_code == 201
        res = client.post(
            "/api/auth/login", json={"login": "lucas", "password": "errada"},
        )
        assert res.status_code == 401
