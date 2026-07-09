from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str | None = None
    is_admin: bool
    avatar_url: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_user(cls, user: "User") -> "UserResponse":  # noqa: F821
        return cls(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            is_admin=user.is_admin,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
        )


class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
