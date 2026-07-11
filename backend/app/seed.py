import random
from datetime import date, timedelta

from app.auth.service import hash_password
from app.database import SessionLocal
from app.enums import GameName
from app.letroso.dictionary import load_dictionary
from app.scores.model import Score
from app.users.model import User


def seed() -> None:
    db = SessionLocal()
    try:
        if not db.query(User).first():
            players = [
                ("admin", "admin123", True),
                ("lucas", "1234", False),
                ("marina", "1234", False),
                ("pedro", "1234", False),
                ("ana", "1234", False),
                ("rafael", "1234", False),
                ("julia", "1234", False),
                ("thiago", "1234", False),
            ]
            user_objs: list[User] = []
            for username, pwd, is_admin in players:
                u = User(
                    username=username,
                    email=f"{username}@example.com",
                    password_hash=hash_password(pwd),
                    is_admin=is_admin,
                )
                db.add(u)
                user_objs.append(u)
            db.flush()

            rng = random.Random(42)
            today = date.today()
            games = [g.value for g in GameName]

            for day_offset in range(45):
                d = today - timedelta(days=day_offset)
                for user in user_objs:
                    for game in games:
                        if rng.random() < 0.12:
                            continue
                        attempts = rng.choices(
                            [1, 2, 3, 4, 5, 6],
                            weights=[10, 25, 30, 20, 10, 5],
                        )[0]
                        db.add(Score(
                            user_id=user.id,
                            game=game,
                            played_date=d,
                            attempts=attempts,
                        ))
            db.commit()
            print(f"Seed complete: {len(user_objs)} users, ~45 days of scores.")
        else:
            print("Users already seeded — skipping user/score seed.")

        load_dictionary(db)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
