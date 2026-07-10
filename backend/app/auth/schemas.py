from pydantic import BaseModel, EmailStr, field_validator


class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("username deve ter pelo menos 3 caracteres")
        return v

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
