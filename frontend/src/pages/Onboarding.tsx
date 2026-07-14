import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Check, X, Loader2 } from "lucide-react";
import styles from "./Onboarding.module.css";

type Status = "idle" | "short" | "checking" | "available" | "taken";

const sanitize = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);

const HINTS: Record<Status, { text: string; color: string }> = {
  idle: { text: "Use letras, números e _", color: "#5b6577" },
  short: { text: "Mínimo de 3 caracteres", color: "#fb923c" },
  checking: { text: "Verificando disponibilidade…", color: "#8b93a7" },
  taken: { text: "Esse nome já está em uso", color: "#f87171" },
  available: { text: "✓ Disponível!", color: "#34d399" },
};

export function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const [username, setUsername] = useState(() => sanitize(user?.username ?? ""));
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  // sugestões estáveis derivadas do username automático
  const [suggestions] = useState(() => {
    const base = (user?.username ?? "jogador").replace(/[0-9]+$/, "") || "jogador";
    const n = Math.floor(10 + Math.random() * 89);
    return Array.from(
      new Set([user?.username ?? base, `${base}${n}`, `${base}_br`]),
    )
      .map(sanitize)
      .filter((s) => s.length >= 3)
      .slice(0, 3);
  });

  // checagem de disponibilidade com debounce
  useEffect(() => {
    const u = username.trim();
    if (u.length === 0) {
      setStatus("idle");
      return;
    }
    if (u.length < 3) {
      setStatus("short");
      return;
    }
    setStatus("checking");
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get<{ available: boolean }>(
          "/auth/check-username",
          { params: { username: u } },
        );
        if (id !== reqId.current) return; // resposta obsoleta
        setStatus(data.available ? "available" : "taken");
      } catch {
        if (id === reqId.current) setStatus("idle");
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [username]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.is_onboarded) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status !== "available" || loading) return;
    setLoading(true);
    try {
      await completeOnboarding(username.trim());
    } catch {
      // corrida: alguém pegou o nome nesse meio tempo
      setStatus("taken");
    } finally {
      setLoading(false);
    }
  };

  const hint = HINTS[status];
  const canSubmit = status === "available" && !loading;

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.brand}>
          <span className={styles.brandBadge}>E</span>
          <div>
            <div className={styles.brandName}>Esperto</div>
            <div className={styles.brandSub}>Ranking de jogos diários</div>
          </div>
        </div>

        <form className={styles.card} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Falta só o seu nome</h1>
          <p className={styles.subtitle}>
            Sua conta é nova por aqui! Escolha um nome de usuário — é assim que a
            galera vai te ver no ranking.
          </p>

          <label className={styles.label}>Nome de usuário</label>
          <div className={styles.inputWrap}>
            <span className={styles.at}>@</span>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(sanitize(e.target.value))}
              placeholder="seunome"
              autoFocus
              autoComplete="off"
            />
            <span className={styles.checkIcon}>
              {status === "checking" && (
                <Loader2 size={17} className={styles.spin} color="#8b93a7" />
              )}
              {status === "available" && <Check size={17} color="#34d399" />}
              {(status === "taken" || status === "short") && (
                <X size={17} color="#f87171" />
              )}
            </span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.hint} style={{ color: hint.color }}>
              {hint.text}
            </span>
            <span className={styles.count}>{username.length}/20</span>
          </div>

          {suggestions.length > 0 && (
            <div className={styles.suggest}>
              <div className={styles.suggestLabel}>Sugestões</div>
              <div className={styles.chips}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.chip}
                    onClick={() => setUsername(s)}
                  >
                    @{s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className={styles.cta} type="submit" disabled={!canSubmit}>
            {loading
              ? "Salvando…"
              : status === "available"
                ? "Confirmar e continuar →"
                : "Escolha um nome disponível"}
          </button>
        </form>
      </div>
    </div>
  );
}
