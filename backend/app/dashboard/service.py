from collections import defaultdict

from sqlalchemy.orm import Session

from app.config import today_manaus
from app.dashboard.schemas import (
    DashboardResponse,
    FriendActivity,
    TriadStatus,
)
from app.enums import GameName
from app.ranking.service import RankingService
from app.scores.repository import ScoreRepository
from app.users.model import User
from app.users.repository import UserRepository


class DashboardService:
    def __init__(self, db: Session):
        self.score_repo = ScoreRepository(db)
        self.user_repo = UserRepository(db)
        self.ranking = RankingService(db)

    def get_dashboard(self, user: User) -> DashboardResponse:
        today = today_manaus()
        today_scores = self.score_repo.get_user_today_scores(user.id, today)

        triad = []
        for game in GameName:
            score = next((s for s in today_scores if s.game == game.value), None)
            triad.append(TriadStatus(
                game=game,
                played=score is not None,
                attempts=score.attempts if score else None,
                score_id=score.id if score else None,
            ))

        streak = self.ranking.calculate_streak(user.id)
        highlights = self.ranking.get_today_highlights()
        champions = self.ranking.get_today_champion()

        all_today = self.score_repo.get_scores_in_period(today, today)
        users = {u.id: u for u in self.user_repo.get_all()}

        friends_map: dict[int, list[str]] = defaultdict(list)
        for s in all_today:
            if s.user_id != user.id:
                friends_map[s.user_id].append(s.game)

        friends_activity = [
            FriendActivity(
                user_id=uid,
                username=users[uid].visible_name,
                avatar_url=users[uid].avatar_url,
                games_played=len(games),
                games=[GameName(g) for g in games],
            )
            for uid, games in friends_map.items()
            if uid in users
        ]
        friends_activity.sort(key=lambda f: -f.games_played)

        return DashboardResponse(
            triad=triad,
            streak=streak,
            highlights=highlights,
            champions=champions,
            friends_activity=friends_activity,
        )
