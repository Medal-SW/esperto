import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMyScores, useRecords } from "../api/hooks";
import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { Skeleton, SkeletonCard } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { ALL_GAMES, GAME_META, type GameName, type Score } from "../types";
import styles from "./History.module.css";

const ICON_MAP: Record<string, React.ReactNode> = {
  target: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  trophy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 1012 0V2z" />
    </svg>
  ),
  crown: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-5 4-5-4-5 4-5-4z" /><path d="M5 16h14v4H5z" />
    </svg>
  ),
  flame: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 23c-4.97 0-8-3.03-8-7 0-2.5 1.5-5.5 3-7.5.83-1.1 1.5-2.17 2-3.5.5 2 2 3.5 3 4.5 1.5-2 2.5-4.5 2.5-7.5 2 2 4.5 5 5 8.5.5 3.5-.5 5.5-1.5 7-1.5 2.5-3.5 5.5-6 5.5z" />
    </svg>
  ),
  zap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

function buildWeeklyAvg(scores: Score[]): { week: string; conexo: number | null; letroso: number | null; expresso: number | null }[] {
  const byWeek: Record<string, Record<string, number[]>> = {};

  for (const s of scores) {
    const d = new Date(s.played_date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!byWeek[key]) byWeek[key] = {};
    const weekEntry = byWeek[key]!;
    if (!weekEntry[s.game]) weekEntry[s.game] = [];
    weekEntry[s.game]!.push(s.attempts);
  }

  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, games]) => {
      const avg = (arr?: number[]) => arr ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
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

function CalendarHeatmap({ scores }: { scores: Score[] }) {
  const dateMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of scores) {
      m[s.played_date] = (m[s.played_date] || 0) + 1;
    }
    return m;
  }, [scores]);

  const today = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: dateMap[key] || 0 });
  }

  return (
    <div className={styles.calendarGrid}>
      {days.map((d) => (
        <div
          key={d.date}
          className={styles.calendarCell}
          title={`${d.date}: ${d.count} jogo${d.count !== 1 ? "s" : ""}`}
          style={{
            background:
              d.count === 0
                ? "var(--bg-hover)"
                : d.count === 1
                  ? "rgba(233,69,96,0.3)"
                  : d.count === 2
                    ? "rgba(233,69,96,0.55)"
                    : "var(--accent)",
          }}
        />
      ))}
    </div>
  );
}

function PersonalStats({ scores }: { scores: Score[] }) {
  const stats = useMemo(() => {
    const result: { game: GameName; total: number; avg: number; best: number }[] = [];
    for (const game of ALL_GAMES) {
      const gs = scores.filter((s) => s.game === game);
      if (gs.length === 0) {
        result.push({ game, total: 0, avg: 0, best: 0 });
        continue;
      }
      const sum = gs.reduce((a, s) => a + s.attempts, 0);
      result.push({
        game,
        total: gs.length,
        avg: Math.round((sum / gs.length) * 10) / 10,
        best: Math.min(...gs.map((s) => s.attempts)),
      });
    }
    return result;
  }, [scores]);

  return (
    <div className={styles.statsGrid}>
      {stats.map((s) => {
        const meta = GAME_META[s.game];
        return (
          <Card key={s.game} hover={false} style={{ borderLeft: `4px solid ${meta.color}` }}>
            <p className={styles.statGameName} style={{ color: meta.color }}>{meta.name}</p>
            <div className={styles.statNumbers}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{s.total}</span>
                <span className={styles.statLabel}>jogos</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{s.avg || "—"}</span>
                <span className={styles.statLabel}>média</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue} style={{ color: meta.color }}>{s.best || "—"}</span>
                <span className={styles.statLabel}>melhor</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function HistoryPage() {
  const { user } = useAuth();
  const { data: scores, isLoading: loadingScores } = useMyScores();
  const { data: recordsData, isLoading: loadingRecords } = useRecords();

  const chartData = useMemo(() => {
    if (!scores) return [];
    return buildWeeklyAvg(scores);
  }, [scores]);

  if (loadingScores || !user) {
    return (
      <div>
        <Skeleton width={200} height={24} radius={8} />
        <div style={{ marginTop: 24 }}><SkeletonCard height={200} /></div>
        <div style={{ marginTop: 24 }}><SkeletonCard height={300} /></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.title}>Meu Desempenho</h1>

      <h3 className={styles.sectionTitle}>Resumo por Jogo</h3>
      <PersonalStats scores={scores || []} />

      <h3 className={styles.sectionTitle}>Atividade (90 dias)</h3>
      <Card hover={false}>
        <CalendarHeatmap scores={scores || []} />
        <div className={styles.calendarLegend}>
          <span className={styles.calendarLegendLabel}>Menos</span>
          {[0, 1, 2, 3].map((n) => (
            <div
              key={n}
              className={styles.calendarCell}
              style={{
                background:
                  n === 0 ? "var(--bg-hover)" :
                  n === 1 ? "rgba(233,69,96,0.3)" :
                  n === 2 ? "rgba(233,69,96,0.55)" :
                  "var(--accent)",
              }}
            />
          ))}
          <span className={styles.calendarLegendLabel}>Mais</span>
        </div>
      </Card>

      {chartData.length > 1 && (
        <>
          <h3 className={styles.sectionTitle}>Evolução Semanal</h3>
          <Card hover={false}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} domain={[1, "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="conexo" name="Conexo" stroke="#e94560" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="letroso" name="Letroso" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="expresso" name="Expresso" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      <h3 className={styles.sectionTitle}>Recordes & Conquistas</h3>
      {loadingRecords ? (
        <SkeletonCard height={120} />
      ) : recordsData?.records.length ? (
        <div className={styles.recordsGrid}>
          {recordsData.records.map((r, i) => {
            const gameColor = r.game ? GAME_META[r.game as GameName]?.color : "var(--accent)";
            return (
              <Card key={i} hover={false} style={{ padding: 16 }}>
                <div className={styles.recordHeader}>
                  <div className={styles.recordIcon} style={{ color: gameColor }}>
                    {ICON_MAP[r.icon] || ICON_MAP.trophy}
                  </div>
                  <div>
                    <p className={styles.recordTitle}>{r.title}</p>
                    <p className={styles.recordDesc}>{r.description}</p>
                  </div>
                </div>
                <div className={styles.recordFooter}>
                  <div className={styles.recordPlayer}>
                    <Avatar username={r.username} avatarUrl={r.avatar_url} size={22} />
                    <span>{r.username}</span>
                  </div>
                  <span className={styles.recordValue} style={{ color: gameColor }}>{r.value}</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card hover={false}>
          <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 14 }}>
            Jogue mais para desbloquear recordes!
          </div>
        </Card>
      )}
    </div>
  );
}
