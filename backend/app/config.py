from datetime import date, datetime
from zoneinfo import ZoneInfo

from pydantic_settings import BaseSettings, SettingsConfigDict

MANAUS_TZ = ZoneInfo("America/Manaus")


def today_manaus() -> date:
    return datetime.now(MANAUS_TZ).date()


class Settings(BaseSettings):
    database_url: str = "postgresql://esperto:esperto123@db:5432/esperto"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    google_client_id: str = ""

    mail_username: str = "seu_email@gmail.com"
    mail_password: str = "sua_senha_de_app"
    mail_from: str = "seu_email@gmail.com"
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_starttls: bool = True
    mail_ssl_tls: bool = False

    frontend_url: str = "url-do-seu-frontend"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
