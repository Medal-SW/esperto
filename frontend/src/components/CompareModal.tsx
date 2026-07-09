import { useCompare } from "../api/hooks";
import { Avatar } from "./Avatar";
import { GAME_META, type GameName } from "../types";
import { X } from "lucide-react";
import styles from "./CompareModal.module.css";

interface Props {
  myId: number;
  myUsername: string;
  myAvatarUrl: string | null;
  opponentId: number;
  opponentUsername: string;
  opponentAvatarUrl: string | null;
  onClose: () => void;
}

export function CompareModal({
  myId,
  myUsername,
  myAvatarUrl,
  opponentId,
  opponentUsername,
  opponentAvatarUrl,
  onClose,
}: Props) {
  const { data, isLoading } = useCompare(myId, opponentId);

  const totalV1 = data?.games.reduce((s, g) => s + g.victories_p1, 0) ?? 0;
  const totalV2 = data?.games.reduce((s, g) => s + g.victories_p2, 0) ?? 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.header}>
          <div className={styles.player}>
            <Avatar username={myUsername} avatarUrl={myAvatarUrl} size={52} />
            <span className={styles.playerName}>{myUsername}</span>
          </div>
          <div className={styles.vs}>VS</div>
          <div className={styles.player}>
            <Avatar username={opponentUsername} avatarUrl={opponentAvatarUrl} size={52} />
            <span className={styles.playerName}>{opponentUsername}</span>
          </div>
        </div>

        {isLoading ? (
          <p className={styles.loading}>Carregando...</p>
        ) : data ? (
          <>
            <div className={styles.scoreBoard}>
              <span className={styles.scoreValue} style={{ color: totalV1 >= totalV2 ? "var(--accent)" : "var(--text-muted)" }}>
                {totalV1}
              </span>
              <span className={styles.scoreLabel}>vitórias totais</span>
              <span className={styles.scoreValue} style={{ color: totalV2 >= totalV1 ? "var(--accent)" : "var(--text-muted)" }}>
                {totalV2}
              </span>
            </div>

            <div className={styles.games}>
              {data.games.map((g) => {
                const meta = GAME_META[g.game as GameName];
                const v1Win = g.victories_p1 > g.victories_p2;
                const v2Win = g.victories_p2 > g.victories_p1;
                const avgTotal = g.avg_p1 + g.avg_p2;

                return (
                  <div key={g.game} className={styles.gameRow}>
                    <div className={styles.gameHeader}>
                      <div className={styles.gameDot} style={{ background: meta.color }} />
                      <span className={styles.gameName}>{meta.name}</span>
                    </div>

                    <div className={styles.statRow}>
                      <span className={styles.statValue} style={{ color: v1Win ? meta.color : "var(--text-secondary)" }}>
                        {g.victories_p1}
                      </span>
                      <div className={styles.barContainer}>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFillLeft}
                            style={{
                              width: g.victories_p1 + g.victories_p2 > 0
                                ? `${(g.victories_p1 / (g.victories_p1 + g.victories_p2)) * 100}%`
                                : "50%",
                              background: meta.color,
                              opacity: v1Win ? 1 : 0.4,
                            }}
                          />
                          <div
                            className={styles.barFillRight}
                            style={{
                              width: g.victories_p1 + g.victories_p2 > 0
                                ? `${(g.victories_p2 / (g.victories_p1 + g.victories_p2)) * 100}%`
                                : "50%",
                              background: meta.color,
                              opacity: v2Win ? 1 : 0.4,
                            }}
                          />
                        </div>
                        <span className={styles.barLabel}>vitórias</span>
                      </div>
                      <span className={styles.statValue} style={{ color: v2Win ? meta.color : "var(--text-secondary)" }}>
                        {g.victories_p2}
                      </span>
                    </div>

                    <div className={styles.statRow}>
                      <span className={styles.statValue} style={{ color: g.avg_p1 > 0 && g.avg_p1 <= g.avg_p2 ? meta.color : "var(--text-secondary)" }}>
                        {g.avg_p1.toFixed(1)}
                      </span>
                      <div className={styles.barContainer}>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barFillLeft}
                            style={{
                              width: avgTotal > 0 ? `${(g.avg_p1 / avgTotal) * 100}%` : "50%",
                              background: meta.color,
                              opacity: g.avg_p1 > 0 && g.avg_p1 <= g.avg_p2 ? 1 : 0.4,
                            }}
                          />
                          <div
                            className={styles.barFillRight}
                            style={{
                              width: avgTotal > 0 ? `${(g.avg_p2 / avgTotal) * 100}%` : "50%",
                              background: meta.color,
                              opacity: g.avg_p2 > 0 && g.avg_p2 <= g.avg_p1 ? 1 : 0.4,
                            }}
                          />
                        </div>
                        <span className={styles.barLabel}>média</span>
                      </div>
                      <span className={styles.statValue} style={{ color: g.avg_p2 > 0 && g.avg_p2 <= g.avg_p1 ? meta.color : "var(--text-secondary)" }}>
                        {g.avg_p2.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
