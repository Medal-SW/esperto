from pydantic import BaseModel, ConfigDict


class EventOption(BaseModel):
    id: int
    name: str
    era: str


class HistoricoGuessEntry(BaseModel):
    event_id: int
    name: str
    year: int
    direction: str


class TargetEvent(BaseModel):
    name: str
    year: int
    category: str | None


class GameStateResponse(BaseModel):
    guesses: list[HistoricoGuessEntry]
    solved: bool
    attempts: int | None
    target: TargetEvent | None

    model_config = ConfigDict(from_attributes=True)


class GuessCreate(BaseModel):
    event_id: int


class GuessResponse(BaseModel):
    guess: HistoricoGuessEntry
    solved: bool
    game_state: GameStateResponse


class HistoricoStatusResponse(BaseModel):
    played_today: bool
    solved: bool
    attempts: int | None
