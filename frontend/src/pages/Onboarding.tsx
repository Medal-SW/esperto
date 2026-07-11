import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

function extractDetail(err: unknown): string {
  const detail = (
    err as { response?: { data?: { detail?: unknown } } }
  )?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return (detail[0] as { msg?: string })?.msg ?? "Dados inválidos";
  }
  return typeof detail === "string" ? detail : "Erro inesperado";
}

export function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (user.is_onboarded) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await completeOnboarding(username.trim());
    } catch (err: unknown) {
      setError(extractDetail(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandText}>Esperto</span>
          <span className={styles.brandSub}>Ranking de jogos diários</span>
        </div>

        <p className={styles.welcome}>
          Bem-vindo! Escolha seu nome de usuário para começar.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Nome de usuário</label>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="escolha um nome de usuário"
              autoFocus
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Confirmar"}
          </button>
        </form>
      </div>
    </div>
  );
}
