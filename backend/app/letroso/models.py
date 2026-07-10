from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LetrosoWord(Base):
    __tablename__ = "letroso_words"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    word: Mapped[str] = mapped_column(String(10), nullable=False, unique=True, index=True)
    word_length: Mapped[int] = mapped_column(Integer, nullable=False)
    is_secret: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    difficulty: Mapped[str | None] = mapped_column(String(10), nullable=True)



class LetrosoSession(Base):
    __tablename__ = "letroso_sessions"
    __table_args__ = (
        UniqueConstraint("user_id", "played_date", name="uq_user_letroso_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    played_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    word_length: Mapped[int] = mapped_column(Integer, nullable=False)
    guesses: Mapped[list] = mapped_column(JSON, nullable=False, server_default="[]")
    solved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now(), onupdate=func.now(),
    )

    user: Mapped["User"] = relationship()  # noqa: F821
