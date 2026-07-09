from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.config import today_manaus
from app.enums import GameName
from app.exceptions import NotFoundError
from app.ranking.schemas import (
    AttemptsDistribution,
    CalendarDay,
    CompareGameResult,
    CompareResponse,
    DailyChampionResponse,
    GameRankingEntry,
    RankingEntry,
    RankingPeriod,
    RecordEntry,
    RecordsResponse,
    TodayHighlight,
)
from app.scores.model import Score
from app.scores.repository import ScoreRepository
from app.users.model import User
from app.users.repository import UserRepository


class RankingService:
    def __init__(self, db: Session):
        self.score_repo = ScoreRepository(db)
        self.user_repo = UserRepository(db)

    def _period_range(self, period: RankingPeriod) -> tuple[date, date]:
        today = today_manaus()
        if period == RankingPeriod.HOJE:
            return today, today
        if period == RankingPeriod.SEMANA:
            return today - timedelta(days=7), today
        if period == RankingPeriod.MES:
            return today - timedelta(days=30), today
        return date(2000, 1, 1), today

    def _compute_victories(
        self, scores: list[Score],
    ) -> tuple[dict[tuple[int, date], int], dict[tuple[int, date], int]]:
        by_game_date: dict[tuple[str, date], list[Score]] = defaultdict(list)
        for s in scores:
            by_game_date[(s.game, s.played_date)].append(s)

        victories: dict[tuple[int, date], int] = defaultdict(int)
        attempts: dict[tuple[int, date], int] = defaultdict(int)

        for game_scores in by_game_date.values():
            min_att = min(s.attempts for s in game_scores)
            for s in game_scores:
                attempts[(s.user_id, s.played_date)] += s.attempts
                if s.attempts == min_att:
                    victories[(s.user_id, s.played_date)] += 1

        return victories, attempts

    def _compute_champions(self, scores: list[Score]) -> dict[date, list[int]]:
        victories, attempts = self._compute_victories(scores)

        games_per_user_date: dict[tuple[int, date], set[str]] = defaultdict(set)
        for s in scores:
            games_per_user_date[(s.user_id, s.played_date)].add(s.game)

        triad_by_date: dict[date, set[int]] = defaultdict(set)
        for (uid, d), games in games_per_user_date.items():
            if len(games) == 3:
                triad_by_date[d].add(uid)

        champions: dict[date, list[int]] = {}
        for d, triad_users in triad_by_date.items():
            candidates = [
                (uid, victories.get((uid, d), 0), attempts.get((uid, d), 0))
                for uid in triad_users
            ]
            if not candidates:
                continue
            max_vic = max(c[1] for c in candidates)
            top = [c for c in candidates if c[1] == max_vic]
            min_att = min(c[2] for c in top)
            champions[d] = [c[0] for c in top if c[2] == min_att]

        return champions

    @staticmethod
    def _streak_from_dates(dates: set[date], today: date) -> int:
        streak = 0
        for i in range(365):
            if (today - timedelta(days=i)) in dates:
                streak += 1
            else:
                break
        return streak

    def calculate_streak(self, user_id: int) -> int:
        played_dates = self.score_repo.get_user_played_dates(user_id)
        return self._streak_from_dates(played_dates, today_manaus())

    def _compute_all_streaks(self, user_ids: set[int]) -> dict[int, int]:
        all_played = self.score_repo.get_all_played_dates()
        today = today_manaus()
        return {
            uid: self._streak_from_dates(all_played.get(uid, set()), today)
            for uid in user_ids
        }

    def _compute_all_win_streaks(
        self,
        user_ids: set[int],
        victories: dict[tuple[int, date], int],
    ) -> dict[int, int]:
        victory_dates_by_user: dict[int, set[date]] = defaultdict(set)
        for (uid, d), vic in victories.items():
            if vic > 0:
                victory_dates_by_user[uid].add(d)

        today = today_manaus()
        return {
            uid: self._streak_from_dates(victory_dates_by_user.get(uid, set()), today)
            for uid in user_ids
        }

    def get_general_ranking(self, period: RankingPeriod) -> list[RankingEntry]:
        start, end = self._period_range(period)
        scores = self.score_repo.get_scores_in_period(start, end)
        users = {u.id: u for u in self.user_repo.get_all()}

        if not scores:
            return []

        victories, _ = self._compute_victories(scores)
        champions = self._compute_champions(scores)

        user_total_victories: dict[int, int] = defaultdict(int)
        user_total_attempts: dict[int, int] = defaultdict(int)
        user_total_games: dict[int, int] = defaultdict(int)
        user_championships: dict[int, int] = defaultdict(int)

        for (uid, _d), vic in victories.items():
            user_total_victories[uid] += vic
        for s in scores:
            user_total_attempts[s.user_id] += s.attempts
            user_total_games[s.user_id] += 1
        for _d, winner_ids in champions.items():
            for uid in winner_ids:
                user_championships[uid] += 1

        active_uids = {s.user_id for s in scores}
        all_scores = self.score_repo.get_all_scores()
        all_victories, _ = self._compute_victories(all_scores)
        play_streaks = self._compute_all_streaks(active_uids)
        win_streaks = self._compute_all_win_streaks(active_uids, all_victories)

        entries = []
        for uid in active_uids:
            if uid not in users:
                continue
            total = user_total_games[uid]
            entries.append(RankingEntry(
                position=0,
                user_id=uid,
                username=users[uid].visible_name,
                avatar_url=users[uid].avatar_url,
                game_victories=user_total_victories[uid],
                daily_championships=user_championships[uid],
                avg_attempts=round(user_total_attempts[uid] / total, 2) if total else 0,
                total_games=total,
                streak=play_streaks.get(uid, 0),
                win_streak=win_streaks.get(uid, 0),
            ))

        entries.sort(key=lambda e: (-e.game_victories, -e.daily_championships, e.avg_attempts))
        for i, e in enumerate(entries):
            e.position = i + 1
        return entries

    def get_game_ranking(
        self, game: GameName, period: RankingPeriod,
    ) -> list[GameRankingEntry]:
        start, end = self._period_range(period)
        scores = self.score_repo.get_scores_in_period(start, end, game=game)
        users = {u.id: u for u in self.user_repo.get_all()}

        if not scores:
            return []

        by_date: dict[date, list[Score]] = defaultdict(list)
        for s in scores:
            by_date[s.played_date].append(s)

        user_victories: dict[int, int] = defaultdict(int)
        user_att: dict[int, int] = defaultdict(int)
        user_games: dict[int, int] = defaultdict(int)

        for day_scores in by_date.values():
            min_att = min(s.attempts for s in day_scores)
            for s in day_scores:
                user_att[s.user_id] += s.attempts
                user_games[s.user_id] += 1
                if s.attempts == min_att:
                    user_victories[s.user_id] += 1

        entries = []
        for uid in {s.user_id for s in scores}:
            if uid not in users:
                continue
            total = user_games[uid]
            entries.append(GameRankingEntry(
                position=0,
                user_id=uid,
                username=users[uid].visible_name,
                avatar_url=users[uid].avatar_url,
                victories=user_victories[uid],
                avg_attempts=round(user_att[uid] / total, 2) if total else 0,
                total_games=total,
            ))

        entries.sort(key=lambda e: (-e.victories, e.avg_attempts))
        for i, e in enumerate(entries):
            e.position = i + 1
        return entries

    def get_today_champion(self) -> list[DailyChampionResponse]:
        today = today_manaus()
        scores = self.score_repo.get_scores_in_period(today, today)
        users = {u.id: u for u in self.user_repo.get_all()}

        if not scores:
            return []

        champions = self._compute_champions(scores)
        champion_ids = champions.get(today, [])
        if not champion_ids:
            return []

        victories, attempts = self._compute_victories(scores)
        return [
            DailyChampionResponse(
                user_id=uid,
                username=users[uid].visible_name,
                avatar_url=users[uid].avatar_url,
                victories=victories.get((uid, today), 0),
                total_attempts=attempts.get((uid, today), 0),
                is_provisional=True,
            )
            for uid in champion_ids
            if uid in users
        ]

    def get_today_highlights(self) -> list[TodayHighlight]:
        today = today_manaus()
        scores = self.score_repo.get_scores_in_period(today, today)
        users = {u.id: u for u in self.user_repo.get_all()}

        highlights = []
        for game in GameName:
            game_scores = [s for s in scores if s.game == game.value]
            if game_scores:
                best = min(game_scores, key=lambda s: s.attempts)
                u = users.get(best.user_id)
                highlights.append(TodayHighlight(
                    game=game,
                    user_id=best.user_id,
                    username=u.visible_name if u else None,
                    avatar_url=u.avatar_url if u else None,
                    attempts=best.attempts,
                ))
            else:
                highlights.append(TodayHighlight(game=game))
        return highlights

    def get_distribution(
        self,
        user_id: int | None = None,
        game: GameName | None = None,
    ) -> list[AttemptsDistribution]:
        scores = self.score_repo.get_all_scores(game=game)
        if user_id:
            scores = [s for s in scores if s.user_id == user_id]

        counts: dict[int, int] = defaultdict(int)
        for s in scores:
            counts[s.attempts] += 1

        return [
            AttemptsDistribution(attempts=k, count=v)
            for k, v in sorted(counts.items())
        ]

    def get_calendar(self, user_id: int) -> list[CalendarDay]:
        today = today_manaus()
        start = today - timedelta(days=90)
        scores = self.score_repo.get_scores_in_period(start, today)
        user_scores = [s for s in scores if s.user_id == user_id]

        by_date: dict[date, int] = defaultdict(int)
        for s in user_scores:
            by_date[s.played_date] += 1

        return [
            CalendarDay(date=d, games_played=c) for d, c in sorted(by_date.items())
        ]

    def compare_players(self, p1_id: int, p2_id: int) -> CompareResponse:
        u1 = self.user_repo.get_by_id(p1_id)
        u2 = self.user_repo.get_by_id(p2_id)
        if not u1 or not u2:
            raise NotFoundError("Jogador não encontrado")

        all_scores = self.score_repo.get_all_scores()
        results = []
        for game in GameName:
            gs = [s for s in all_scores if s.game == game.value]
            p1_scores = [s for s in gs if s.user_id == p1_id]
            p2_scores = [s for s in gs if s.user_id == p2_id]

            avg1 = sum(s.attempts for s in p1_scores) / len(p1_scores) if p1_scores else 0
            avg2 = sum(s.attempts for s in p2_scores) / len(p2_scores) if p2_scores else 0

            by_date: dict[date, list[Score]] = defaultdict(list)
            for s in gs:
                by_date[s.played_date].append(s)

            v1 = v2 = 0
            for day_scores in by_date.values():
                min_att = min(s.attempts for s in day_scores)
                p1_won = any(
                    s.user_id == p1_id and s.attempts == min_att for s in day_scores
                )
                p2_won = any(
                    s.user_id == p2_id and s.attempts == min_att for s in day_scores
                )
                if p1_won:
                    v1 += 1
                if p2_won:
                    v2 += 1

            results.append(CompareGameResult(
                game=game,
                avg_p1=round(avg1, 2),
                avg_p2=round(avg2, 2),
                victories_p1=v1,
                victories_p2=v2,
            ))

        return CompareResponse(
            player1_id=p1_id,
            player1_username=u1.visible_name,
            player2_id=p2_id,
            player2_username=u2.visible_name,
            games=results,
        )

    def get_records(self) -> RecordsResponse:
        all_scores = self.score_repo.get_all_scores()
        users = {u.id: u for u in self.user_repo.get_all()}
        records: list[RecordEntry] = []

        if not all_scores:
            return RecordsResponse(records=[])

        for game in GameName:
            gs = [s for s in all_scores if s.game == game.value]
            if not gs:
                continue
            best = min(gs, key=lambda s: (s.attempts, s.played_date))
            u = users.get(best.user_id)
            if u:
                records.append(RecordEntry(
                    title=f"Recorde {game.value.capitalize()}",
                    description=f"Menor tentativa de todos os tempos em {game.value.capitalize()}",
                    icon="target",
                    user_id=u.id,
                    username=u.visible_name,
                    avatar_url=u.avatar_url,
                    value=f"{best.attempts} tent. ({best.played_date.strftime('%d/%m')})",
                    game=game,
                ))

        victories, _ = self._compute_victories(all_scores)
        user_total_vic: dict[int, int] = defaultdict(int)
        for (uid, _d), vic in victories.items():
            user_total_vic[uid] += vic
        if user_total_vic:
            top_uid = max(user_total_vic, key=lambda k: user_total_vic[k])
            u = users.get(top_uid)
            if u:
                records.append(RecordEntry(
                    title="Mais Vitorioso",
                    description="Maior número total de vitórias em jogos individuais",
                    icon="trophy",
                    user_id=u.id,
                    username=u.visible_name,
                    avatar_url=u.avatar_url,
                    value=f"{user_total_vic[top_uid]} vitórias",
                ))

        champions = self._compute_champions(all_scores)
        user_champ: dict[int, int] = defaultdict(int)
        for _d, ids in champions.items():
            for uid in ids:
                user_champ[uid] += 1
        if user_champ:
            top_uid = max(user_champ, key=lambda k: user_champ[k])
            u = users.get(top_uid)
            if u:
                records.append(RecordEntry(
                    title="Campeão Supremo",
                    description="Maior número de títulos diários",
                    icon="crown",
                    user_id=u.id,
                    username=u.visible_name,
                    avatar_url=u.avatar_url,
                    value=f"{user_champ[top_uid]} títulos",
                ))

        user_ids = set(users.keys())
        play_streaks = self._compute_all_streaks(user_ids)
        win_streaks = self._compute_all_win_streaks(user_ids, victories)

        if play_streaks:
            best_uid = max(play_streaks, key=lambda k: play_streaks[k])
            if play_streaks[best_uid] > 0:
                u = users[best_uid]
                records.append(RecordEntry(
                    title="Mais Dedicado",
                    description="Maior sequência de dias consecutivos jogando",
                    icon="flame",
                    user_id=u.id,
                    username=u.visible_name,
                    avatar_url=u.avatar_url,
                    value=f"{play_streaks[best_uid]} dias",
                ))

        if win_streaks:
            best_uid = max(win_streaks, key=lambda k: win_streaks[k])
            if win_streaks[best_uid] > 0:
                u = users[best_uid]
                records.append(RecordEntry(
                    title="Imbatível",
                    description="Maior sequência de dias consecutivos vencendo",
                    icon="zap",
                    user_id=u.id,
                    username=u.visible_name,
                    avatar_url=u.avatar_url,
                    value=f"{win_streaks[best_uid]} dias",
                ))

        return RecordsResponse(records=records)
