import hashlib
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session, attributes

from app.config import today_manaus
from app.enums import GameName
from app.exceptions import ForbiddenError
from app.historico.models import HistoricoEvent, HistoricoSession
from app.historico.repository import HistoricoRepository
from app.historico.schemas import (
    EventOption,
    GameStateResponse,
    GuessResponse,
    HistoricoGuessEntry,
    HistoricoStatusResponse,
    TargetEvent,
)
from app.historico.utils import era_for_year
from app.scores.schemas import ScoreCreate
from app.scores.service import ScoreService
from app.users.model import User

_daily_event_cache: dict[date, int] = {}


class HistoricoService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = HistoricoRepository(db)

    def get_game_state(self, user: User) -> GameStateResponse:
        today = today_manaus()
        session = self._get_or_create_session(user, today)
        return self._to_game_state(session)

    def get_event_options(self) -> list[EventOption]:
        return [
            EventOption(id=e.id, name=e.name, era=era_for_year(e.year))
            for e in self.repo.get_all_events()
        ]

    def submit_guess(self, user: User, event_id: int) -> GuessResponse:
        today = today_manaus()
        session = self._get_or_create_session(user, today)

        if session.solved:
            raise ForbiddenError("Jogo já finalizado hoje")

        event = self.repo.get_event(event_id)
        if not event:
            raise HTTPException(status_code=422, detail="Evento não encontrado")

        if any(g["event_id"] == event.id for g in session.guesses):
            raise HTTPException(status_code=422, detail="Evento já tentado hoje")

        target = self.repo.get_event(session.target_event_id)
        direction = self._compute_direction(event, target)

        entry = HistoricoGuessEntry(
            event_id=event.id,
            name=event.name,
            year=event.year,
            direction=direction,
        )
        session.guesses = session.guesses + [entry.model_dump()]
        attributes.flag_modified(session, "guesses")

        solved = direction == "acertou"
        if solved:
            session.solved = True
            session.attempts = len(session.guesses)
            self._register_score(user, session.attempts)

        self.repo.save_session(session)

        return GuessResponse(
            guess=entry,
            solved=solved,
            game_state=self._to_game_state(session),
        )

    def get_status(self, user: User) -> HistoricoStatusResponse:
        today = today_manaus()
        session = self.repo.get_session(user.id, today)
        if not session:
            return HistoricoStatusResponse(
                played_today=False, solved=False, attempts=None
            )
        return HistoricoStatusResponse(
            played_today=True,
            solved=session.solved,
            attempts=session.attempts,
        )

    @staticmethod
    def _compute_direction(guess: HistoricoEvent, target: HistoricoEvent) -> str:
        if guess.id == target.id:
            return "acertou"
        if guess.year < target.year:
            return "depois"
        if guess.year > target.year:
            return "antes"
        return "mesmo_ano"

    def _get_or_create_session(self, user: User, today: date) -> HistoricoSession:
        session = self.repo.get_session(user.id, today)
        if session:
            return session
        target_id = self._get_daily_event_id(today)
        return self.repo.create_session(user.id, today, target_id)

    def _get_daily_event_id(self, played_date: date) -> int:
        if played_date in _daily_event_cache:
            return _daily_event_cache[played_date]

        count = self.repo.count_events()
        if count == 0:
            raise HTTPException(
                status_code=500, detail="Nenhum evento disponível para hoje"
            )

        date_str = played_date.isoformat()
        event_hash = int(
            hashlib.sha256(f"historico-evento-{date_str}".encode()).hexdigest(), 16
        )
        event = self.repo.get_event_by_offset(event_hash % count)
        if not event:
            raise HTTPException(
                status_code=500, detail="Nenhum evento disponível para hoje"
            )

        _daily_event_cache[played_date] = event.id
        for d in list(_daily_event_cache):
            if d < played_date:
                del _daily_event_cache[d]

        return event.id

    def _register_score(self, user: User, attempts: int) -> None:
        score_data = ScoreCreate(game=GameName.HISTORICO, attempts=attempts)
        ScoreService(self.db).submit_score(user, score_data)

    def _to_game_state(self, session: HistoricoSession) -> GameStateResponse:
        guesses = [HistoricoGuessEntry(**g) for g in session.guesses]
        target = None
        if session.solved:
            event = self.repo.get_event(session.target_event_id)
            if event:
                target = TargetEvent(
                    name=event.name, year=event.year, category=event.category
                )
        return GameStateResponse(
            guesses=guesses,
            solved=session.solved,
            attempts=session.attempts,
            target=target,
        )
