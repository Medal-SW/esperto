from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.auth.schemas import validate_username

if TYPE_CHECKING:
    from users.model import User


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str | None = None
    email: EmailStr
    is_admin: bool
    avatar_url: str | None = None
    google_linked: bool = False
    has_password: bool = True
    is_onboarded: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_user(cls, user: "User") -> "UserResponse":
        return cls(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            email=user.email,
            is_admin=user.is_admin,
            avatar_url=user.avatar_url,
            google_linked=user.google_id is not None,
            has_password=user.password_hash is not None,
            is_onboarded=user.is_onboarded,
            created_at=user.created_at,
        )


class UpdateProfileRequest(BaseModel):
    display_name: str | None = Field(None, max_length=50)


class CompleteOnboardingRequest(BaseModel):
    username: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        return validate_username(v)
