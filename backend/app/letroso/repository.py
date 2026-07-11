from datetime import date

from sqlalchemy.orm import Session

from app.letroso.models import LetrosoSession, LetrosoWord


class LetrosoRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_session(self, user_id: int, played_date: date) -> LetrosoSession | None:
        return (
            self.db.query(LetrosoSession)
            .filter(
                LetrosoSession.user_id == user_id,
                LetrosoSession.played_date == played_date,
            )
            .first()
        )

    def create_session(
        self, user_id: int, played_date: date, word_length: int
    ) -> LetrosoSession:
        session = LetrosoSession(
            user_id=user_id,
            played_date=played_date,
            word_length=word_length,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def save_session(self, session: LetrosoSession) -> LetrosoSession:
        self.db.commit()
        self.db.refresh(session)
        return session

    def is_valid_word(self, normalized_word: str) -> bool:
        return (
            self.db.query(LetrosoWord)
            .filter(LetrosoWord.word == normalized_word)
            .first()
            is not None
        )

    def get_secret_candidates(self, word_length: int) -> list[LetrosoWord]:
        return (
            self.db.query(LetrosoWord)
            .filter(
                LetrosoWord.word_length == word_length,
                LetrosoWord.is_secret == True,
            )
            .order_by(LetrosoWord.word)
            .all()
        )
