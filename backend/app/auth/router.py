import logging
import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.google import suggest_username, verify_google_credential
from app.auth.schemas import (
    ForgotPasswordRequest,
    GoogleConnectRequest,
    GoogleLoginRequest,
    GoogleLoginResponse,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)
from app.auth.service import (
    create_access_token,
    create_reset_token,
    decode_reset_token,
    hash_password,
    verify_password,
)
from app.config import settings
from app.database import get_db
from app.users.model import User
from app.users.repository import UserRepository
from app.users.schemas import (
    CompleteOnboardingRequest,
    UpdateProfileRequest,
    UserResponse,
)
from app.utils.email import send_password_reset_email

UPLOAD_DIR = Path("/app/uploads/avatars")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 2 * 1024 * 1024

router = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger("uvicorn.error")


@router.post(
    "/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    if repo.get_by_username(body.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username já existe",
        )
    if repo.get_by_email(body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado",
        )
    try:
        user = repo.create(
            username=body.username,
            email=body.email,
            password_hash=hash_password(body.password),
        )
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado",
        )
    return UserResponse.from_user(user)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_login(body.login)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )
    if user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Esta conta usa login com Google. Use o botão "Entrar com o Google".',
        )
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )
    return TokenResponse(access_token=create_access_token(user.id))


def _verify_credential_or_401(credential: str):
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Login com Google não está configurado",
        )
    try:
        return verify_google_credential(credential)
    except ValueError as exc:
        logger.warning("Falha ao validar credential do Google: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não foi possível validar sua conta Google. Tente novamente.",
        )


def _unique_username(repo: UserRepository, email: str) -> str:
    base = suggest_username(email)
    username = base
    suffix = 2
    while repo.get_by_username(username):
        username = f"{base}{suffix}"
        suffix += 1
    return username


@router.post("/google", response_model=GoogleLoginResponse)
def google_login(body: GoogleLoginRequest, db: Session = Depends(get_db)):
    info = _verify_credential_or_401(body.credential)
    repo = UserRepository(db)
    user = repo.get_by_google_id(info.sub)
    if user:
        return GoogleLoginResponse(access_token=create_access_token(user.id))

    # Auto-vínculo por e-mail verificado pelo Google. Trade-off aceito: quem
    # cadastrar o e-mail de outra pessoa "captura" o futuro login Google dela
    # (não há verificação de e-mail no cadastro) — aceitável para o grupo.
    by_email = repo.get_by_email(info.email)
    if by_email:
        if by_email.google_id is not None:
            # e-mail pertence a uma conta já vinculada a outro sub do Google
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este e-mail já está vinculado a outra conta Google",
            )
        try:
            repo.link_google(by_email, info.sub, info.email)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Esta conta Google já está vinculada a outro usuário",
            )
        logger.info(
            "Auto-link Google: user_id=%s email=%s", by_email.id, info.email,
        )
        return GoogleLoginResponse(access_token=create_access_token(by_email.id))

    # e-mail novo: cria a conta na hora, sem senha, com username provisório e
    # is_onboarded=False; o frontend força a tela de escolha de username
    try:
        user = repo.create(
            username=_unique_username(repo, info.email),
            email=info.email,
            password_hash=None,
            google_id=info.sub,
            display_name=info.name[:50] if info.name else None,
            is_onboarded=False,
        )
    except IntegrityError:
        db.rollback()
        # corrida: mesmo credential processado em paralelo
        user = repo.get_by_google_id(info.sub)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Não foi possível criar sua conta. Tente novamente.",
            )
        return GoogleLoginResponse(access_token=create_access_token(user.id))
    logger.info(
        "Auto-cadastro Google: user_id=%s username=%s email=%s",
        user.id, user.username, info.email,
    )
    return GoogleLoginResponse(
        access_token=create_access_token(user.id), created=True,
    )


@router.post("/google/connect", response_model=UserResponse)
def google_connect(
    body: GoogleConnectRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    info = _verify_credential_or_401(body.credential)
    if user.google_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Sua conta já está conectada ao Google",
        )
    repo = UserRepository(db)
    if repo.get_by_google_id(info.sub):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta conta Google já está vinculada a outro usuário",
        )
    email_owner = repo.get_by_email(info.email)
    if email_owner and email_owner.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este e-mail do Google já está em uso por outra conta",
        )
    try:
        updated = repo.link_google(user, info.sub, info.email)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta conta Google já está vinculada a outro usuário",
        )
    return UserResponse.from_user(updated)


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
    repo = UserRepository(db)
    updated = repo.update_display_name(user, display_name or None)
    return UserResponse.from_user(updated)


@router.get("/check-username")
def check_username(
    username: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    u = username.strip().lower()
    if len(u) < 3:
        return {"available": False, "reason": "short"}
    existing = UserRepository(db).get_by_username(u)
    available = existing is None or existing.id == user.id
    return {"available": available, "reason": None if available else "taken"}


@router.post("/complete-onboarding", response_model=UserResponse)
def complete_onboarding(
    body: CompleteOnboardingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.is_onboarded:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conta já finalizada",
        )
    username = body.username
    repo = UserRepository(db)
    existing = repo.get_by_username(username)
    if existing and existing.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username já existe",
        )
    try:
        updated = repo.complete_onboarding(user, username)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username já existe",
        )
    return UserResponse.from_user(updated)


@router.post("/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.",
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=400, detail="Arquivo muito grande. Máximo 2 MB."
        )

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


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(
    body: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    user = repo.get_by_email(body.email)

    if user:
        token = create_reset_token(user.email)
        background_tasks.add_task(send_password_reset_email, user.email, token)

    return {
        "message": "Se o e-mail existir em nossa base, um link de recuperação será enviado em instantes."
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = decode_reset_token(body.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de recuperação inválido ou expirado.",
        )

    repo = UserRepository(db)
    user = repo.get_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    new_password_hash = hash_password(body.new_password)
    repo.update_password(user, new_password_hash)

    return {"message": "Senha redefinida com sucesso. Você já pode fazer login."}
