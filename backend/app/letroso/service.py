import hashlib
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session, attributes

from app.config import today_manaus
from app.enums import GameName
from app.exceptions import ForbiddenError
from app.letroso.models import LetrosoSession
from app.letroso.repository import LetrosoRepository
from app.letroso.schemas import (
    GameStateResponse,
    GuessEntry,
    GuessResponse,
    LetrosoStatusResponse,
    LetterFeedback,
)
from app.letroso.utils import compute_feedback, normalize_word
from app.scores.schemas import ScoreCreate
from app.scores.service import ScoreService
from app.users.model import User

_daily_word_cache: dict[date, str] = {}


class LetrosoService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = LetrosoRepository(db)

    def get_game_state(self, user: User) -> GameStateResponse:
        today = today_manaus()
        session = self._get_or_create_session(user, today)
        return self._to_game_state(session)

    def submit_guess(self, user: User, raw_guess: str) -> GuessResponse:
        today = today_manaus()
        session = self._get_or_create_session(user, today)

        if session.solved:
            raise ForbiddenError("Jogo já finalizado hoje")

        normalized_guess = normalize_word(raw_guess)
        secret = self._get_daily_word(today)

        if len(normalized_guess) != len(secret):
            raise HTTPException(
                status_code=422,
                detail=f"Palavra deve ter {len(secret)} letras",
            )

        if not normalized_guess.isalpha():
            raise HTTPException(status_code=422, detail="Palavra deve conter apenas letras")

        if not self.repo.is_valid_word(normalized_guess):
            raise HTTPException(status_code=422, detail="Palavra não encontrada no dicionário")

        feedback_raw = compute_feedback(normalized_guess, secret)
        feedback = [LetterFeedback(**f) for f in feedback_raw]

        guess_entry = GuessEntry(guess=normalized_guess, feedback=feedback)
        session.guesses = session.guesses + [guess_entry.model_dump()]
        attributes.flag_modified(session, "guesses")

        solved = all(f.state == "correct" for f in feedback)
        if solved:
            session.solved = True
            session.attempts = len(session.guesses)
            self._register_score(user, session.attempts)

        self.repo.save_session(session)

        return GuessResponse(
            guess=normalized_guess,
            feedback=feedback,
            solved=solved,
            game_state=self._to_game_state(session),
        )

    def get_status(self, user: User) -> LetrosoStatusResponse:
        today = today_manaus()
        session = self.repo.get_session(user.id, today)
        if not session:
            return LetrosoStatusResponse(
                played_today=False, solved=False, attempts=None
            )
        return LetrosoStatusResponse(
            played_today=True,
            solved=session.solved,
            attempts=session.attempts,
        )

    def _get_or_create_session(self, user: User, today: date) -> LetrosoSession:
        session = self.repo.get_session(user.id, today)
        if session:
            return session
        secret = self._get_daily_word(today)
        return self.repo.create_session(user.id, today, len(secret))

    def _get_daily_word(self, played_date: date) -> str:
        if played_date in _daily_word_cache:
            return _daily_word_cache[played_date]

        date_str = played_date.isoformat()
        length_hash = int(
            hashlib.sha256(f"letroso-length-{date_str}".encode()).hexdigest(), 16
        )
        word_length = 4 + (length_hash % 7)

        candidates = self.repo.get_secret_candidates(word_length)
        if not candidates:
            for offset in [1, -1, 2, -2, 3]:
                alt_length = word_length + offset
                if 4 <= alt_length <= 10:
                    candidates = self.repo.get_secret_candidates(alt_length)
                    if candidates:
                        break

        if not candidates:
            raise HTTPException(
                status_code=500, detail="Nenhuma palavra disponível para hoje"
            )

        word_hash = int(
            hashlib.sha256(f"letroso-word-{date_str}".encode()).hexdigest(), 16
        )
        index = word_hash % len(candidates)
        word = candidates[index].word

        _daily_word_cache[played_date] = word
        for d in list(_daily_word_cache):
            if d < played_date:
                del _daily_word_cache[d]

        return word

    def _register_score(self, user: User, attempts: int) -> None:
        score_data = ScoreCreate(game=GameName.LETROSO, attempts=attempts)
        ScoreService(self.db).submit_score(user, score_data)

    def _to_game_state(self, session: LetrosoSession) -> GameStateResponse:
        guesses = [GuessEntry(**g) for g in session.guesses]
        return GameStateResponse(
            word_length=session.word_length,
            guesses=guesses,
            solved=session.solved,
            attempts=session.attempts,
        )
