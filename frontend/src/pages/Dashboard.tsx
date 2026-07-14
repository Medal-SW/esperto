import { useNavigate } from "react-router-dom";
import { useDashboard, useGeneralRanking, useMyScores } from "../api/hooks";
import { Avatar } from "../components/Avatar";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { GAME_META, type GameName, type Score } from "../types";
import { Users } from "lucide-react";
import styles from "./Dashboard.module.css";

function greetingWord(): { word: string; emoji: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { word: "Bom dia", emoji: "☀️" };
  if (h >= 12 && h < 18) return { word: "Boa tarde", emoji: "🌤️" };
  return { word: "Boa noite", emoji: "🌙" };
}

function longDate(d: Date): string {
  const s = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// escala de qualidade por nº de tentativas (menor é melhor)
function quality(v: number): string {
  if (v <= 1) return "#22c55e";
  if (v <= 2) return "#34d399";
  if (v <= 3) return "#84cc16";
  if (v <= 4) return "#fbbf24";
  if (v <= 6) return "#fb923c";
  return "#f43f5e";
}

function ratingLabel(v: number): string {
  if (v <= 1) return "Perfeito!";
  if (v <= 2) return "Ótimo";
  if (v <= 3) return "Muito bom";
  if (v <= 4) return "Bom";
  if (v <= 6) return "Deu trabalho";
  return "Sofrido";
}

// média de tentativas por dia (últimos N dias) a partir dos meus scores
function dailyAverages(scores: Score[], days: number): number[] {
  const byDate = new Map<string, { sum: number; n: number }>();
  for (const s of scores) {
    const cur = byDate.get(s.played_date) ?? { sum: 0, n: 0 };
    cur.sum += s.attempts;
    cur.n += 1;
    byDate.set(s.played_date, cur);
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-days)
    .map(([, v]) => v.sum / v.n);
}

function DashboardSkeleton() {
  return (
    <div>
      <div className={styles.header}>
        <div>
          <Skeleton width={260} height={30} radius={8} />
          <div style={{ marginTop: 8 }}>
            <Skeleton width={220} height={14} radius={4} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 22 }}>
        <div style={{ flex: 1 }}>
          <div className={styles.triadGrid}>
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
          </div>
        </div>
        <div style={{ width: 320, display: "flex", flexDirection: "column", gap: 18 }}>
          <SkeletonCard height={120} />
          <SkeletonCard height={160} />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();
  const ranking = useGeneralRanking("todos");
  const myScores = useMyScores();
  const navigate = useNavigate();

  if (isLoading || !data || !user) {
    return <DashboardSkeleton />;
  }

  const doneCount = data.triad.filter((t) => t.played).length;
  const allDone = doneCount === 3;
  const { word, emoji } = greetingWord();

  const rankingList = ranking.data ?? [];
  const myEntry = rankingList.find((e) => e.user_id === user.id);

  // pills do topo
  const topStats = [
    { icon: "🔥", value: String(data.streak), label: "sequência", color: "#d9a441" },
    {
      icon: "🏆",
      value: myEntry ? `${myEntry.position}º` : "—",
      label: "ranking geral",
      color: "#fb7185",
    },
    {
      icon: "⚡",
      value: myEntry ? myEntry.avg_attempts.toFixed(1) : "—",
      label: "média",
      color: "var(--success)",
    },
  ];

  const pendingMsg = allDone
    ? "tudo registrado hoje! 🎉"
    : `${3 - doneCount} ${3 - doneCount === 1 ? "jogo pendente" : "jogos pendentes"}`;

  // vizinhos no ranking (eu + adjacentes)
  const myIdx = rankingList.findIndex((e) => e.user_id === user.id);
  const nearby =
    myIdx >= 0
      ? rankingList.slice(Math.max(0, myIdx - 1), myIdx + 2)
      : rankingList.slice(0, 3);

  // sparkline: média por dia dos últimos 10 dias
  const spark = dailyAverages(myScores.data ?? [], 10);
  const sMin = Math.min(...spark);
  const sMax = Math.max(...spark);
  const barHeight = (v: number) => {
    if (spark.length < 2 || sMax === sMin) return 50;
    // menor é melhor → barra mais alta
    return 15 + ((sMax - v) / (sMax - sMin)) * 85;
  };
  // delta: metade recente vs metade anterior
  let avgDelta: { text: string; color: string } | null = null;
  if (spark.length >= 4) {
    const half = Math.floor(spark.length / 2);
    const older = spark.slice(0, half);
    const recent = spark.slice(-half);
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    const d = avg(older) - avg(recent);
    if (Math.abs(d) >= 0.05) {
      avgDelta =
        d > 0
          ? { text: `▼ ${d.toFixed(1)} melhor`, color: "var(--success)" }
          : { text: `▲ ${Math.abs(d).toFixed(1)}`, color: "#fb7185" };
    }
  }

  const streakMsg = allDone
    ? "Sequência garantida hoje! 🔥"
    : data.streak > 0
      ? `Registre hoje para chegar a ${data.streak + 1} dias 🎯`
      : "Comece sua sequência hoje! 🎯";

  return (
    <div>
      {/* saudação + stats */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            {word}, {user.display_name || user.username}! {emoji}
          </h1>
          <div className={styles.greetingSub}>
            {longDate(new Date())} · {pendingMsg}
          </div>
        </div>
      )}

      <h3 className={styles.sectionTitle}>Seus Jogos Diários</h3>
      <div className={styles.triadGrid}>
        {data.triad.map((t) => {
          const meta = GAME_META[t.game];
          return (
            <Card
              key={t.game}
              onClick={!t.played ? () => navigate("/submit") : undefined}
              style={{ borderLeft: `4px solid ${meta.color}`, cursor: t.played ? "default" : "pointer" }}
            >
              <div className={styles.triadCard}>
                <div>
                  <p className={styles.triadName}>{meta.name}</p>
                  {t.played ? (
                    <p className={styles.triadStatus} style={{ color: meta.color }}>
                      {t.attempts} {t.attempts === 1 ? "tentativa" : "tentativas"}
                    </p>
                  ) : (
                    <p className={styles.triadStatus} style={{ color: "var(--text-muted)" }}>
                      Pendente
                    </p>
                  )}
                </div>
                <div
                  className={styles.triadIcon}
                  style={{
                    background: t.played ? meta.color : "var(--bg-hover)",
                    color: t.played ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {t.played ? <Check size={18} /> : "—"}
                </div>
                <div className={styles.statPillLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {/* COLUNA PRINCIPAL */}
        <div className={styles.mainCol}>
          {/* tríade */}
          <div>
            <div className={styles.sectionHead}>
              <span className={styles.sectionLabel}>Sua tríade diária</span>
              <span className={styles.sectionMeta}>{doneCount}/3 registrados</span>
            </div>
            <div className={styles.triadGrid}>
              {data.triad.map((t) => {
                const meta = GAME_META[t.game];
                const done = t.played;
                const v = t.attempts ?? 0;
                const qc = done ? quality(v) : meta.color;
                return (
                  <button
                    key={t.game}
                    className={styles.gameCard}
                    style={done ? { borderColor: `${meta.color}55` } : undefined}
                    onClick={() => navigate("/submit")}
                  >
                    <span
                      className={styles.gameBar}
                      style={{ background: meta.color }}
                    />
                    <div className={styles.gameTop}>
                      <div className={styles.gameLeft}>
                        <span
                          className={styles.gameTile}
                          style={{
                            background: `${meta.color}22`,
                            color: meta.color,
                          }}
                        >
                          {meta.name[0]}
                        </span>
                        <div>
                          <div className={styles.gameName}>{meta.name}</div>
                          <div
                            className={styles.gameStatus}
                            style={{
                              color: done ? "var(--success)" : "var(--text-secondary)",
                            }}
                          >
                            {done ? "Registrado" : "Pendente"}
                          </div>
                        </div>
                      </div>
                      <span
                        className={styles.gameBadge}
                        style={
                          done
                            ? {
                                background: meta.color,
                                color: "#0b0f19",
                                border: "none",
                              }
                            : undefined
                        }
                      >
                        {done ? "✓" : "○"}
                      </span>
                    </div>
                    <div className={styles.gameBottom}>
                      <div className={styles.gameResult}>
                        <span
                          className={styles.gameResultBig}
                          style={{ color: done ? qc : "var(--text-muted)" }}
                        >
                          {done ? v : "—"}
                        </span>
                        <span className={styles.gameResultUnit}>
                          {done
                            ? v === 1
                              ? "tentativa"
                              : "tentativas"
                            : "ainda não jogou"}
                        </span>
                      </div>
                      {done && (
                        <span className={styles.gameRating} style={{ color: qc }}>
                          {ratingLabel(v)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              className={`${styles.cta} ${allDone ? styles.ctaDone : ""}`}
              onClick={() => navigate("/submit")}
            >
              {allDone ? "Editar resultados de hoje" : "Registrar Resultados →"}
            </button>
          </div>

          {/* atividade dos amigos */}
          <div>
            <div className={styles.sectionHead}>
              <span className={styles.sectionLabel}>Atividade dos amigos</span>
            </div>
            <div className={styles.feedCard}>
              {data.friends_activity.length > 0 ? (
                <>
                  {data.friends_activity.map((f) => (
                    <div key={f.user_id} className={styles.feedRow}>
                      <Avatar
                        username={f.username}
                        avatarUrl={f.avatar_url}
                        size={36}
                      />
                      <div className={styles.feedText}>
                        <div className={styles.feedName}>
                          <b>{f.username}</b> registrou{" "}
                          {f.games_played === 3
                            ? "todos os jogos"
                            : `${f.games_played}/3 jogos`}
                        </div>
                        <div className={styles.feedMeta}>hoje</div>
                      </div>
                      <div className={styles.feedDots}>
                        {(Object.keys(GAME_META) as GameName[]).map((g) => (
                          <span
                            key={g}
                            className={styles.feedDot}
                            style={{
                              background: f.games.includes(g)
                                ? GAME_META[g].color
                                : "var(--bg-hover)",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className={styles.feedFooter}>
                    <button
                      className={styles.feedLink}
                      onClick={() => navigate("/ranking")}
                    >
                      Ver ranking completo →
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <Users size={30} stroke="var(--text-muted)" />
                  Nenhum amigo registrou resultados hoje.
                </div>
              )}
            </div>
          </div>
        </div>

      <h3 className={styles.sectionTitle}>Atividade dos Amigos</h3>
      <Card hover={false}>
        {data.friends_activity.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.friends_activity.map((f) => (
              <div key={f.user_id} className={styles.friendRow}>
                <Avatar username={f.username} avatarUrl={f.avatar_url} size={32} />
                <div className={styles.friendInfo}>
                  <p className={styles.friendName}>{f.username}</p>
                  <p className={styles.friendGames}>{f.games_played}/{ALL_GAMES.length} jogos registrados</p>
                </div>
              </div>
            </div>
            <div className={styles.streakMsg}>{streakMsg}</div>
          </div>

          {/* posição */}
          <div className={styles.railCard}>
            <div className={styles.railLabel}>Sua posição</div>
            {myEntry ? (
              <>
                <div className={styles.rankTop}>
                  <span className={styles.rankBig}>{myEntry.position}º</span>
                </div>
                {nearby.map((n) => {
                  const you = n.user_id === user.id;
                  return (
                    <div key={n.user_id} className={styles.nearbyRow}>
                      <span
                        className={`${styles.nearbyRank} ${n.position === 1 ? styles.nearbyRankTop : ""}`}
                      >
                        {n.position}
                      </span>
                      <Avatar
                        username={n.username}
                        avatarUrl={n.avatar_url}
                        size={26}
                      />
                      <span
                        className={`${styles.nearbyName} ${you ? styles.nearbyNameYou : ""}`}
                      >
                        {n.username}
                        {you ? " (você)" : ""}
                      </span>
                      <span className={styles.nearbyWins}>{n.game_victories}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className={styles.streakUnit}>
                Registre jogos para entrar no ranking.
              </div>
            )}
          </div>

          {/* média + sparkline */}
          <div className={styles.railCard}>
            <div className={styles.railLabel}>Média de tentativas</div>
            <div className={styles.avgTop}>
              <span className={styles.avgBig}>
                {myEntry ? myEntry.avg_attempts.toFixed(1) : "—"}
              </span>
              {avgDelta && (
                <span className={styles.avgDelta} style={{ color: avgDelta.color }}>
                  {avgDelta.text}
                </span>
              )}
            </div>
            {spark.length >= 2 && (
              <>
                <div className={styles.spark}>
                  {spark.map((v, i) => (
                    <div
                      key={i}
                      className={styles.sparkBar}
                      style={{ height: `${barHeight(v)}%`, background: quality(v) }}
                    />
                  ))}
                </div>
                <div className={styles.avgFoot}>
                  Últimos {spark.length} dias · menor é melhor
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
