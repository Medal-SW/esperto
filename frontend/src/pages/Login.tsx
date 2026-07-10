import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import styles from "./Login.module.css";

export function LoginPage() {
  const { user, login, signup } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(username, password);
      } else {
        await signup(username, password);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Erro inesperado";
      setError(msg);
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

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "login" ? styles.tabActive : ""}`}
            onClick={() => setTab("login")}
          >
            Entrar
          </button>
          <button
            className={`${styles.tab} ${tab === "signup" ? styles.tabActive : ""}`}
            onClick={() => setTab("signup")}
          >
            Criar Conta
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu nome de usuário"
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Senha</label>

            <div className={styles.passwordWrapper}>
              <input
                className={styles.input}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="sua senha"
              />

              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading
              ? "Carregando..."
              : tab === "login"
                ? "Entrar"
                : "Criar Conta"}
          </button>
        </form>
      </div>
    </div>
  );
}
