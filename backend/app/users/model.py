from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.scores.model import Score


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    display_name: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    avatar_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now()
    )

    scores: Mapped[list["Score"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    @property
    def visible_name(self) -> str:
        return self.display_name or self.username

    @property
    def avatar_url(self) -> str | None:
        if self.avatar_filename:
            return f"/uploads/avatars/{self.avatar_filename}"
        return None
