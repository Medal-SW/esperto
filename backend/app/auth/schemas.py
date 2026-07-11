import re

from pydantic import BaseModel, EmailStr, field_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_username(v: str) -> str:
    v = v.strip()
    if len(v) < 3:
        raise ValueError("username deve ter pelo menos 3 caracteres")
    return v


def validate_email(v: str) -> str:
    v = v.strip().lower()
    if not EMAIL_RE.match(v):
        raise ValueError("e-mail inválido")
    return v


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: str) -> str:
        return validate_username(v)

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        return validate_email(v)

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, v: str) -> str:
        if len(v) < 4:
            raise ValueError("senha deve ter pelo menos 4 caracteres")
        return v


class LoginRequest(BaseModel):
    login: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_not_empty(cls, v: str) -> str:
        if len(v) < 4:
            raise ValueError("senha deve ter pelo menos 4 caracteres")
        return v


class GoogleLoginRequest(BaseModel):
    credential: str


class GoogleLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # conta criada agora neste login (frontend usa para pedir o nickname)
    created: bool = False


class GoogleConnectRequest(BaseModel):
    credential: str
