import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useDashboard,
  useGeneralRanking,
  useMyScores,
  useRecords,
} from "../api/hooks";
import { Avatar } from "../components/Avatar";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { ALL_GAMES, GAME_META, GameName, type Score } from "../types";
import { Target, Trophy, Crown, Flame, Zap } from "lucide-react";
import styles from "./History.module.css";

const ICON_MAP: Record<string, React.ReactNode> = {
  target: <Target size={20} />,
  trophy: <Trophy size={20} />,
  crown: <Crown size={20} />,
  flame: <Flame size={20} />,
  zap: <Zap size={20} />,
};

interface WeekPoint {
  week: string;
  conexo: number | null;
  letroso: number | null;
  expresso: number | null;
}

function buildWeeklyAvg(scores: Score[]): WeekPoint[] {
  const byWeek: Record<string, Record<string, number[]>> = {};
  for (const s of scores) {
    const d = new Date(s.played_date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    (byWeek[key] ??= {});
    (byWeek[key]![s.game] ??= []).push(s.attempts);
  }
  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, games]) => {
      const avg = (arr?: number[]) =>
        arr ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
      const d = new Date(week);
      const label = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      return {
        week: label,
        conexo: avg(games["conexo"]),
        letroso: avg(games["letroso"]),
        expresso: avg(games["expresso"]),
      };
    });
}

// tendência por jogo: metade antiga vs recente (menor média = melhorou)
function gameTrend(scores: Score[], game: GameName): number {
  const gs = scores
    .filter((s) => s.game === game)
    .sort((a, b) => a.played_date.localeCompare(b.played_date));
  if (gs.length < 4) return 0;
  const half = Math.floor(gs.length / 2);
  const avg = (a: Score[]) => a.reduce((x, s) => x + s.attempts, 0) / a.length;
  return avg(gs.slice(0, half)) - avg(gs.slice(-half));
}

// células do heatmap: 13 semanas alinhadas a domingo, colunas = semanas
function buildHeat(scores: Score[]) {
  const byDate: Record<string, number> = {};
  for (const s of scores) byDate[s.played_date] = (byDate[s.played_date] || 0) + 1;
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - 7 * 12);
  const cells: { key: string; count: number }[] = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    cells.push({ key, count: byDate[key] || 0 });
  }
  return cells;
}

function heatColor(count: number): string {
  if (count <= 0) return "var(--bg-hover)";
  if (count === 1) return "rgba(233, 69, 96, 0.32)";
  if (count === 2) return "rgba(233, 69, 96, 0.6)";
  return "var(--accent)";
}
const HEAT_KEY = [
  "var(--bg-hover)",
  "rgba(233, 69, 96, 0.32)",
  "rgba(233, 69, 96, 0.6)",
  "var(--accent)",
];

function TrendBadge({ trend }: { trend: number }) {
  if (Math.abs(trend) < 0.05) {
    return <span className={`${styles.trendBadge} ${styles.trendFlat}`}>▬ 0.0</span>;
  }
  const improved = trend > 0;
  return (
    <span
      className={`${styles.trendBadge} ${improved ? styles.trendDown : styles.trendUp}`}
    >
      {improved ? "▼" : "▲"} {Math.abs(trend).toFixed(1)}
    </span>
  );
}

export function HistoryPage() {
  const { user } = useAuth();
  const { data: scores, isLoading: loadingScores } = useMyScores();
  const { data: recordsData, isLoading: loadingRecords } = useRecords();
  const dashboard = useDashboard();
  const ranking = useGeneralRanking("todos");
  const [hidden, setHidden] = useState<Set<GameName>>(new Set());

  const chartData = useMemo(() => (scores ? buildWeeklyAvg(scores) : []), [scores]);
  const heat = useMemo(() => buildHeat(scores ?? []), [scores]);

  if (loadingScores || !user) {
    return (
      <div>
        <Skeleton width={220} height={30} radius={8} />
        <div style={{ marginTop: 24 }}>
          <SkeletonCard height={140} />
        </div>
        <div style={{ marginTop: 22 }}>
          <SkeletonCard height={300} />
        </div>
      </div>
    );
  }

  const all = scores ?? [];
  const myEntry = ranking.data?.find((e) => e.user_id === user.id);
  const totalGames = all.length;
  const overallAvg = totalGames
    ? (all.reduce((a, s) => a + s.attempts, 0) / totalGames).toFixed(1)
    : "—";

  const hero = [
    { icon: "🎮", value: String(totalGames), label: "jogos totais", color: "var(--text-primary)" },
    { icon: "⚡", value: overallAvg, label: "média geral", color: "#34d399" },
    { icon: "🔥", value: String(dashboard.data?.streak ?? 0), label: "sequência", color: "#fbbf24" },
    { icon: "🏆", value: String(myEntry?.daily_championships ?? 0), label: "títulos", color: "#fb7185" },
  ];

  const summary = ALL_GAMES.map((game) => {
    const gs = all.filter((s) => s.game === game);
    const total = gs.length;
    const avg = total ? Math.round((gs.reduce((a, s) => a + s.attempts, 0) / total) * 10) / 10 : 0;
    const best = total ? Math.min(...gs.map((s) => s.attempts)) : 0;
    return { game, meta: GAME_META[game], total, avg, best, trend: gameTrend(all, game) };
  });

  const toggle = (g: GameName) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });

  const records = recordsData?.records ?? [];

  return (
    <div>
      {/* header + hero */}
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Suas estatísticas</div>
          <h1 className={styles.title}>Meu Desempenho</h1>
        </div>
        <div className={styles.heroStats}>
          {hero.map((h) => (
            <div key={h.label} className={styles.heroPill}>
              <span className={styles.heroPillIcon}>{h.icon}</span>
              <div>
                <div className={styles.heroPillValue} style={{ color: h.color }}>
                  {h.value}
                </div>
                <div className={styles.heroPillLabel}>{h.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* resumo por jogo */}
      <div className={styles.summaryGrid}>
        {summary.map((g) => (
          <div key={g.game} className={styles.gameCard}>
            <span className={styles.gameBar} style={{ background: g.meta.color }} />
            <div className={styles.gameCardHead}>
              <div className={styles.gameCardLeft}>
                <span
                  className={styles.gameTile}
                  style={{ background: `${g.meta.color}22`, color: g.meta.color }}
                >
                  {g.meta.name[0]}
                </span>
                <span className={styles.gameName}>{g.meta.name}</span>
              </div>
              <TrendBadge trend={g.trend} />
            </div>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <div className={styles.metricValue}>{g.total}</div>
                <div className={styles.metricLabel}>jogos</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricValue}>{g.avg || "—"}</div>
                <div className={styles.metricLabel}>média</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricValue} style={{ color: g.meta.color }}>
                  {g.best || "—"}
                </div>
                <div className={styles.metricLabel}>melhor</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* gráfico + heatmap */}
      <div className={styles.contentGrid}>
        {/* evolução */}
        <div className={styles.panel}>
          <div className={styles.chartHead}>
            <div>
              <div className={styles.chartTitle}>Evolução da média</div>
              <div className={styles.chartSub}>
                Média de tentativas por semana · menor é melhor
              </div>
            </div>
            <div className={styles.legend}>
              {ALL_GAMES.map((game) => {
                const meta = GAME_META[game];
                const off = hidden.has(game);
                return (
                  <button
                    key={game}
                    className={`${styles.legendItem} ${off ? styles.legendDim : ""}`}
                    onClick={() => toggle(game)}
                  >
                    <span
                      className={styles.legendSwatch}
                      style={{ background: meta.color }}
                    />
                    <span className={styles.legendName}>{meta.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  domain={[1, "auto"]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    fontSize: 13,
                  }}
                />
                <Line type="monotone" dataKey="conexo" name="Conexo" stroke={GAME_META[GameName.CONEXO].color} strokeWidth={2.5} dot={false} connectNulls hide={hidden.has(GameName.CONEXO)} />
                <Line type="monotone" dataKey="letroso" name="Letroso" stroke={GAME_META[GameName.LETROSO].color} strokeWidth={2.5} dot={false} connectNulls hide={hidden.has(GameName.LETROSO)} />
                <Line type="monotone" dataKey="expresso" name="Expresso" stroke={GAME_META[GameName.EXPRESSO].color} strokeWidth={2.5} dot={false} connectNulls hide={hidden.has(GameName.EXPRESSO)} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>Jogue mais dias para ver sua evolução.</div>
          )}
        </div>

        {/* heatmap */}
        <div className={styles.rightCol}>
          <div className={styles.panel}>
            <div className={styles.heatHead}>
              <span className={styles.heatTitle}>Consistência</span>
              {(dashboard.data?.streak ?? 0) > 0 && (
                <span className={styles.heatStreak}>
                  🔥 sequência de {dashboard.data!.streak} dias
                </span>
              )}
            </div>
            <div className={styles.heatGrid}>
              {heat.map((c) => (
                <div
                  key={c.key}
                  className={styles.heatCell}
                  title={`${c.key}: ${c.count} jogo${c.count !== 1 ? "s" : ""}`}
                  style={{ background: heatColor(c.count) }}
                />
              ))}
            </div>
            <div className={styles.heatFoot}>
              <span className={styles.heatFootLabel}>13 semanas</span>
              <div className={styles.heatKey}>
                <span className={styles.heatFootLabel}>Menos</span>
                {HEAT_KEY.map((c, i) => (
                  <span key={i} className={styles.heatKeyCell} style={{ background: c }} />
                ))}
                <span className={styles.heatFootLabel}>Mais</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* recordes & conquistas */}
      <div className={styles.achWrap}>
        <div className={styles.achLabel}>Recordes &amp; Conquistas</div>
        {loadingRecords ? (
          <SkeletonCard height={120} />
        ) : records.length ? (
          <div className={styles.achGrid}>
            {records.map((r, i) => {
              const color = r.game ? GAME_META[r.game as GameName]?.color : "var(--accent)";
              const mine = r.user_id === user.id;
              return (
                <div
                  key={i}
                  className={`${styles.achCard} ${mine ? styles.achCardMine : ""}`}
                >
                  {mine && <span className={styles.mineBadge}>você</span>}
                  <div className={styles.achTop}>
                    <span
                      className={styles.achIcon}
                      style={{ background: `${color}1f`, color }}
                    >
                      {ICON_MAP[r.icon] || ICON_MAP.trophy}
                    </span>
                    <div>
                      <div className={styles.achTitle}>{r.title}</div>
                      <div className={styles.achDesc}>{r.description}</div>
                    </div>
                  </div>
                  <div className={styles.achFooter}>
                    <Avatar username={r.username} avatarUrl={r.avatar_url} size={26} />
                    <span className={styles.achHolder}>{r.username}</span>
                    <span className={styles.achValue} style={{ color }}>
                      {r.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`${styles.panel} ${styles.empty}`}>
            Jogue mais para desbloquear recordes!
          </div>
        )}
      </div>
    </div>
  );
}
