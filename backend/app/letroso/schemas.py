from pydantic import BaseModel, ConfigDict, field_validator


class LetterFeedback(BaseModel):
    letter: str
    state: str
    position: int


class GuessEntry(BaseModel):
    guess: str
    feedback: list[LetterFeedback]


class GameStateResponse(BaseModel):
    word_length: int
    guesses: list[GuessEntry]
    solved: bool
    attempts: int | None

    model_config = ConfigDict(from_attributes=True)


class GuessCreate(BaseModel):
    guess: str

    @field_validator("guess")
    @classmethod
    def guess_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Tentativa não pode ser vazia")
        return v


class GuessResponse(BaseModel):
    guess: str
    feedback: list[LetterFeedback]
    solved: bool
    game_state: GameStateResponse


class LetrosoStatusResponse(BaseModel):
    played_today: bool
    solved: bool
    attempts: int | None
