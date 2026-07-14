from datetime import date

from sqlalchemy.orm import Session

from app.historico.models import HistoricoEvent, HistoricoSession


class HistoricoRepository:
    def __init__(self, db: Session):
        self.db = db

    def count_events(self) -> int:
        return self.db.query(HistoricoEvent).count()

    def get_event(self, event_id: int) -> HistoricoEvent | None:
        return (
            self.db.query(HistoricoEvent)
            .filter(HistoricoEvent.id == event_id)
            .first()
        )

    def get_event_by_offset(self, offset: int) -> HistoricoEvent | None:
        return (
            self.db.query(HistoricoEvent)
            .order_by(HistoricoEvent.id)
            .offset(offset)
            .first()
        )

    def get_all_events(self) -> list[HistoricoEvent]:
        return (
            self.db.query(HistoricoEvent)
            .order_by(HistoricoEvent.name)
            .all()
        )

    def get_session(self, user_id: int, played_date: date) -> HistoricoSession | None:
        return (
            self.db.query(HistoricoSession)
            .filter(
                HistoricoSession.user_id == user_id,
                HistoricoSession.played_date == played_date,
            )
            .first()
        )

    def create_session(
        self, user_id: int, played_date: date, target_event_id: int
    ) -> HistoricoSession:
        session = HistoricoSession(
            user_id=user_id,
            played_date=played_date,
            target_event_id=target_event_id,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def save_session(self, session: HistoricoSession) -> HistoricoSession:
        self.db.commit()
        self.db.refresh(session)
        return session
