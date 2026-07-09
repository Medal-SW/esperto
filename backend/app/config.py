from datetime import date, datetime
from zoneinfo import ZoneInfo

from pydantic_settings import BaseSettings

MANAUS_TZ = ZoneInfo("America/Manaus")


def today_manaus() -> date:
    return datetime.now(MANAUS_TZ).date()


class Settings(BaseSettings):
    database_url: str = "postgresql://ranking:ranking123@db:5432/esperto"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    model_config = {"env_file": ".env"}


settings = Settings()
