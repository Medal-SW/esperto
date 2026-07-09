from sqlalchemy.orm import Session

from app.users.model import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username).first()

    def get_all(self) -> list[User]:
        return self.db.query(User).order_by(User.username).all()

    def create(self, username: str, password_hash: str) -> User:
        user = User(username=username, password_hash=password_hash)
        self.db.add(user)
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
