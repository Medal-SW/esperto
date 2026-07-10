import re
from dataclasses import dataclass

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.config import settings


@dataclass
class GoogleUserInfo:
    sub: str
    email: str
    name: str | None


def verify_google_credential(credential: str) -> GoogleUserInfo:
    payload = id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        settings.google_client_id,
        clock_skew_in_seconds=10,
    )
    if not payload.get("email_verified"):
        raise ValueError("email não verificado")
    return GoogleUserInfo(
        sub=payload["sub"],
        email=payload["email"],
        name=payload.get("name"),
    )


def suggest_username(email: str) -> str:
    base = re.sub(r"[^a-z0-9_]", "", email.split("@")[0].lower())
    return base if len(base) >= 3 else "jogador"
