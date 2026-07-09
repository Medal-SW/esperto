import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.schemas import LoginRequest, SignupRequest, TokenResponse
from app.auth.service import create_access_token, hash_password, verify_password
from app.database import get_db
from app.users.model import User
from app.users.repository import UserRepository
from app.users.schemas import UpdateProfileRequest, UserResponse

UPLOAD_DIR = Path("/app/uploads/avatars")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 2 * 1024 * 1024

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    if repo.get_by_username(body.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username já existe",
        )
    user = repo.create(
        username=body.username,
        password_hash=hash_password(body.password),
    )
    return UserResponse.from_user(user)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_username(body.username)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return UserResponse.from_user(user)


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    body: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    display_name = body.display_name.strip() if body.display_name else None
    if display_name is not None and len(display_name) > 50:
        raise HTTPException(status_code=400, detail="Nickname muito longo. Máximo 50 caracteres.")
    repo = UserRepository(db)
    updated = repo.update_display_name(user, display_name or None)
    return UserResponse.from_user(updated)


@router.post("/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 2 MB.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "avatar.png").suffix or ".png"
    filename = f"{user.id}_{uuid.uuid4().hex[:8]}{ext}"

    if user.avatar_filename:
        old_path = UPLOAD_DIR / user.avatar_filename
        old_path.unlink(missing_ok=True)

    (UPLOAD_DIR / filename).write_bytes(content)

    repo = UserRepository(db)
    updated = repo.update_avatar(user, filename)
    return UserResponse.from_user(updated)


@router.delete("/avatar", status_code=status.HTTP_204_NO_CONTENT)
def delete_avatar(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.avatar_filename:
        (UPLOAD_DIR / user.avatar_filename).unlink(missing_ok=True)
    UserRepository(db).update_avatar(user, None)
