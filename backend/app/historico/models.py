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


class HistoricoEvent(Base):
    __tablename__ = "historico_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    category: Mapped[str | None] = mapped_column(String(20), nullable=True)


class HistoricoSession(Base):
    __tablename__ = "historico_sessions"
    __table_args__ = (
        UniqueConstraint("user_id", "played_date", name="uq_user_historico_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    played_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    target_event_id: Mapped[int] = mapped_column(
        ForeignKey("historico_events.id", ondelete="RESTRICT"), nullable=False,
    )
    guesses: Mapped[list] = mapped_column(JSON, nullable=False, server_default="[]")
    solved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now(), onupdate=func.now(),
    )

    user: Mapped["User"] = relationship()  # noqa: F821
    target_event: Mapped["HistoricoEvent"] = relationship()
