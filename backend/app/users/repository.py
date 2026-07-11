from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.users.model import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username).first()

    def get_by_google_id(self, google_id: str) -> User | None:
        return self.db.query(User).filter(User.google_id == google_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email.strip().lower()).first()

    def get_by_login(self, login: str) -> User | None:
        return (
            self.db.query(User)
            .filter(
                or_(
                    User.username == login,
                    User.email == login.strip().lower(),
                )
            )
            .first()
        )

    def get_all(self) -> list[User]:
        return self.db.query(User).order_by(User.username).all()

    def create(
        self,
        username: str,
        email: str,
        password_hash: str | None = None,
        google_id: str | None = None,
        display_name: str | None = None,
        is_onboarded: bool = True,
    ) -> User:
        user = User(
            username=username,
            password_hash=password_hash,
            email=email.strip().lower(),
            google_id=google_id,
            display_name=display_name,
            is_onboarded=is_onboarded,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def complete_onboarding(self, user: User, username: str) -> User:
        user.username = username
        user.is_onboarded = True
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_password(self, user: User, password_hash: str) -> User:
        user.password_hash = password_hash
        self.db.commit()
        self.db.refresh(user)
        return user

    def link_google(self, user: User, google_id: str, email: str) -> User:
        user.google_id = google_id
        user.email = email.strip().lower()
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_display_name(self, user: User, display_name: str | None) -> User:
        user.display_name = display_name
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_avatar(self, user: User, filename: str | None) -> User:
        user.avatar_filename = filename
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()
