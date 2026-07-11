from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.historico.schemas import (
    EventOption,
    GameStateResponse,
    GuessCreate,
    GuessResponse,
    HistoricoStatusResponse,
)
from app.historico.service import HistoricoService
from app.users.model import User

router = APIRouter(prefix="/historico", tags=["historico"])


@router.get("/today", response_model=GameStateResponse)
def get_today(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return HistoricoService(db).get_game_state(user)


@router.get("/eventos", response_model=list[EventOption])
def get_eventos(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return HistoricoService(db).get_event_options()


@router.post("/guess", response_model=GuessResponse)
def submit_guess(
    body: GuessCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return HistoricoService(db).submit_guess(user, body.event_id)


@router.get("/status", response_model=HistoricoStatusResponse)
def get_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return HistoricoService(db).get_status(user)
