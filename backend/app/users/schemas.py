from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, EmailStr, Field

if TYPE_CHECKING:
    from users.model import User


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str | None = None
    email: EmailStr
    is_admin: bool
    avatar_url: str | None = None
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
            created_at=user.created_at,
        )


class UpdateProfileRequest(BaseModel):
    display_name: str | None = Field(None, max_length=50)
