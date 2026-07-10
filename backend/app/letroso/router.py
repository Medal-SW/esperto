from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.letroso.schemas import (
    GameStateResponse,
    GuessCreate,
    GuessResponse,
    LetrosoStatusResponse,
)
from app.letroso.service import LetrosoService
from app.users.model import User

router = APIRouter(prefix="/letroso", tags=["letroso"])


@router.get("/today", response_model=GameStateResponse)
def get_today(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return LetrosoService(db).get_game_state(user)


@router.post("/guess", response_model=GuessResponse)
def submit_guess(
    body: GuessCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return LetrosoService(db).submit_guess(user, body.guess)


@router.get("/status", response_model=LetrosoStatusResponse)
def get_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return LetrosoService(db).get_status(user)
