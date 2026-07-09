import { useState } from "react";
import { useGameRanking, useGeneralRanking } from "../api/hooks";
import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { CompareModal } from "../components/CompareModal";
import { SkeletonRow } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import {
  ALL_GAMES,
  GAME_META,
  GameName,
  type GameRankingEntry,
  type RankingEntry,
  type RankingPeriod,
} from "../types";
import { Flame, Zap, Trophy, Scale } from "lucide-react";
import styles from "./Ranking.module.css";

const PERIOD_OPTIONS: { id: RankingPeriod; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "todos", label: "Todos" },
];

const GAME_OPTIONS = [
  { id: "geral" as const, label: "Geral" },
  ...ALL_GAMES.map((g) => ({ id: g, label: GAME_META[g].name })),
];

function RankingSkeleton() {
  return (
    <Card hover={false} style={{ padding: 16 }}>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </Card>
  );
}

function RankingEmpty() {
  return (
    <Card hover={false}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "32px 0",
        color: "var(--text-muted)",
      }}>
        <Trophy size={36} stroke="var(--text-muted)" strokeWidth={1.5} />
        <p style={{ fontSize: 14 }}>Nenhum resultado neste período.</p>
      </div>
    </Card>
  );
}

interface CompareTarget {
  id: number;
  username: string;
  avatar_url: string | null;
}

export function RankingPage() {
  const [gameFilter, setGameFilter] = useState<"geral" | GameName>("geral");
  const [period, setPeriod] = useState<RankingPeriod>("todos");
  const [compareTarget, setCompareTarget] = useState<CompareTarget | null>(null);
  const { user } = useAuth();

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Ranking</h1>
      </div>

      <div className={styles.filters}>
        {GAME_OPTIONS.map((o) => (
          <button
            key={o.id}
            className={styles.filterBtn}
            onClick={() => setGameFilter(o.id)}
            style={{
              background: gameFilter === o.id ? "var(--accent)" : "var(--bg-card)",
              color: gameFilter === o.id ? "#fff" : "var(--text-secondary)",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className={styles.periodFilters}>
        {PERIOD_OPTIONS.map((o) => (
          <button
            key={o.id}
            className={`${styles.periodBtn} ${period === o.id ? styles.periodBtnActive : ""}`}
            onClick={() => setPeriod(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {gameFilter === "geral" ? (
        <GeneralRanking period={period} onCompare={setCompareTarget} />
      ) : (
        <GameRanking game={gameFilter} period={period} onCompare={setCompareTarget} />
      )}

      {compareTarget && user && (
        <CompareModal
          myId={user.id}
          myUsername={user.username}
          myAvatarUrl={user.avatar_url}
          opponentId={compareTarget.id}
          opponentUsername={compareTarget.username}
          opponentAvatarUrl={compareTarget.avatar_url}
          onClose={() => setCompareTarget(null)}
        />
      )}
    </div>
  );
}

function GeneralRanking({
  period,
  onCompare,
}: {
  period: RankingPeriod;
  onCompare: (t: CompareTarget) => void;
}) {
  const { user } = useAuth();
  const { data: ranking, isLoading } = useGeneralRanking(period);

  if (isLoading) return <RankingSkeleton />;
  if (!ranking?.length) return <RankingEmpty />;

  return (
    <>
      {ranking.length >= 3 && <Podium top3={ranking.slice(0, 3)} />}

      <Card hover={false} style={{ padding: 0, overflow: "hidden" }}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Jogador</th>
                <th>Vitórias</th>
                <th>Títulos</th>
                <th>Média</th>
                <th>Jogos</th>
                <th>
                  <div className={styles.streakHeader}>
                    <span className={styles.streakHeaderItem}>
                      <Flame size={10} fill="var(--game-expresso)" stroke="none" />
                      Ativa
                    </span>
                    <span className={styles.streakHeaderItem}>
                      <Zap size={10} fill="none" stroke="var(--game-letroso)" strokeWidth={2.5} />
                      Quente
                    </span>
                  </div>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr
                  key={r.user_id}
                  style={{
                    background: r.user_id === user?.id ? "var(--accent-soft)" : "transparent",
                  }}
                >
                  <td className={r.position <= 3 ? styles.positionTop : styles.position} style={{ width: 40 }}>
                    {r.position}
                  </td>
                  <td>
                    <div className={styles.playerCell}>
                      <Avatar username={r.username} avatarUrl={r.avatar_url} size={28} />
                      <span className={styles.playerName}>
                        {r.username}
                        {r.user_id === user?.id && <span className={styles.youBadge}>(você)</span>}
                      </span>
                    </div>
                  </td>
                  <td className={styles.statBold}>{r.game_victories}</td>
                  <td className={styles.statMuted}>{r.daily_championships}</td>
                  <td className={styles.statBold}>{r.avg_attempts.toFixed(1)}</td>
                  <td className={styles.statMuted}>{r.total_games}</td>
                  <td>
                    <div className={styles.streakCell}>
                      <span className={styles.tooltip} data-tip="Sequência ativa: dias seguidos jogando">
                        <Flame size={12} fill="var(--game-expresso)" stroke="none" />
                        <span style={{ fontSize: 12, color: r.streak > 0 ? "var(--game-expresso)" : "var(--text-muted)" }}>{r.streak}</span>
                      </span>
                      <span className={styles.tooltip} data-tip="Sequência quente: dias seguidos vencendo algum jogo">
                        <Zap size={12} fill="none" stroke="var(--game-letroso)" strokeWidth={2.5} />
                        <span style={{ fontSize: 12, color: r.win_streak > 0 ? "var(--game-letroso)" : "var(--text-muted)" }}>{r.win_streak}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    {r.user_id !== user?.id && (
                      <button
                        className={styles.compareBtn}
                        onClick={() => onCompare({ id: r.user_id, username: r.username, avatar_url: r.avatar_url })}
                      >
                        <Scale size={14} />
                        <span className={styles.compareBtnLabel}>Comparar</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function GameRanking({
  game,
  period,
  onCompare,
}: {
  game: GameName;
  period: RankingPeriod;
  onCompare: (t: CompareTarget) => void;
}) {
  const { user } = useAuth();
  const { data: ranking, isLoading } = useGameRanking(game, period);
  const meta = GAME_META[game];

  if (isLoading) return <RankingSkeleton />;
  if (!ranking?.length) return <RankingEmpty />;

  return (
    <Card hover={false} style={{ padding: 0, overflow: "hidden" }}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Jogador</th>
              <th>Vitórias</th>
              <th>Média</th>
              <th>Jogos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r: GameRankingEntry) => (
              <tr
                key={r.user_id}
                style={{
                  background: r.user_id === user?.id ? "var(--accent-soft)" : "transparent",
                }}
              >
                <td className={r.position <= 3 ? styles.positionTop : styles.position} style={{ width: 40 }}>
                  {r.position}
                </td>
                <td>
                  <div className={styles.playerCell}>
                    <Avatar username={r.username} avatarUrl={r.avatar_url} size={28} />
                    <span className={styles.playerName}>
                      {r.username}
                      {r.user_id === user?.id && <span className={styles.youBadge}>(você)</span>}
                    </span>
                  </div>
                </td>
                <td className={styles.statBold} style={{ color: meta.color }}>{r.victories}</td>
                <td className={styles.statBold}>{r.avg_attempts.toFixed(1)}</td>
                <td className={styles.statMuted}>{r.total_games}</td>
                <td>
                  {r.user_id !== user?.id && (
                    <button
                      className={styles.compareBtn}
                      onClick={() => onCompare({ id: r.user_id, username: r.username, avatar_url: r.avatar_url })}
                      title={`Comparar com ${r.username}`}
                    >
                      <Scale size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Podium({ top3 }: { top3: (RankingEntry | GameRankingEntry)[] }) {
  const order = [1, 0, 2] as const;
  const heights = [88, 110, 72];
  const labels = ["2º", "1º", "3º"];
  const colors = ["#94a3b8", "var(--accent)", "#b45309"];

  return (
    <div className={styles.podium}>
      {order.map((idx, i) => {
        const r = top3[idx];
        if (!r) return null;
        const victories = "game_victories" in r ? r.game_victories : r.victories;
        return (
          <div key={idx} className={styles.podiumItem}>
            <Avatar username={r.username} avatarUrl={"avatar_url" in r ? r.avatar_url : null} size={idx === 0 ? 46 : 38} />
            <span className={styles.podiumName}>{r.username}</span>
            <span className={styles.podiumAvg}>{victories} vitórias</span>
            <div
              className={styles.podiumBar}
              style={{ height: heights[i], background: colors[i] }}
            >
              {labels[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
