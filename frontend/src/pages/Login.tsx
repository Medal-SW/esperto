import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { GoogleButton } from "../components/GoogleButton";
import styles from "./Login.module.css";

function extractDetail(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  // erro 422 do Pydantic vem como array de objetos
  if (Array.isArray(detail)) {
    return (detail[0] as { msg?: string })?.msg ?? "Dados inválidos";
  }
  return typeof detail === "string" ? detail : "Erro inesperado";
}

function Logo() {
  return (
    <>
      <span className={styles.logoBadge}>E</span>
      <div>
        <div className={styles.logoName}>Esperto</div>
        <div className={styles.logoSub}>Ranking de jogos diários</div>
      </div>
    </>
  );
}

export function LoginPage() {
  const { user, login, signup, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return (
      <Navigate to={user.is_onboarded ? "/dashboard" : "/onboarding"} replace />
    );
  }

  const isLogin = tab === "login";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await signup(username, email, password);
      }
    } catch (err: unknown) {
      setError(extractDetail(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setError("");
    setLoading(true);
    try {
      // conta nova entra com is_onboarded=false; o redirect acima leva ao
      // /onboarding para escolher o username
      await loginWithGoogle(credential);
    } catch (err: unknown) {
      setError(extractDetail(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ESQUERDA: showcase da marca */}
      <div className={styles.showcase}>
        <div className={`${styles.blob} ${styles.blobTop}`} />
        <div className={`${styles.blob} ${styles.blobBottom}`} />

        <div className={styles.logo}>
          <Logo />
        </div>

        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Registre. Compare.
            <br />
            <span className={styles.heroAccent}>Domine o ranking.</span>
          </h1>
          <p className={styles.heroText}>
            Conexo, Letroso, Expresso e mais. Anote suas tentativas do dia e
            veja quem é o mais esperto entre seus amigos.
          </p>
          <div className={styles.chips}>
            <span className={`${styles.chip} ${styles.chipConexo}`}>
              <span className={styles.chipDot} />
              Conexo
            </span>
            <span className={`${styles.chip} ${styles.chipLetroso}`}>
              <span className={styles.chipDot} />
              Letroso
            </span>
            <span className={`${styles.chip} ${styles.chipExpresso}`}>
              <span className={styles.chipDot} />
              Expresso
            </span>
          </div>
        </div>
      </div>

      {/* DIREITA: formulário */}
      <div className={styles.formSide}>
        <div className={styles.formInner}>
          <div className={styles.mobileLogo}>
            <Logo />
          </div>

          <h2 className={styles.heading}>
            {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
          </h2>
          <p className={styles.sub}>
            {isLogin
              ? "Entre para registrar seus jogos de hoje"
              : "Comece a competir em segundos"}
          </p>

          <div className={styles.toggle}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${isLogin ? styles.toggleBtnActive : ""}`}
              onClick={() => setTab("login")}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${!isLogin ? styles.toggleBtnActive : ""}`}
              onClick={() => setTab("signup")}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <div>
                <label className={styles.label}>
                  {isLogin ? "Username ou e-mail" : "Username"}
                </label>
                <input
                  className={styles.input}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    isLogin
                      ? "seu nome de usuário ou e-mail"
                      : "seu nome de usuário"
                  }
                  autoFocus
                />
              </div>

              {!isLogin && (
                <div>
                  <label className={styles.label}>E-mail</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu e-mail"
                    required
                  />
                </div>
              )}

              <div>
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
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {isLogin && (
                  <a
                    href="#"
                    className={styles.forgot}
                    onClick={(e) => e.preventDefault()}
                  >
                    Esqueci a senha
                  </a>
                )}
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
            </button>
          </form>

          <div className={styles.divider}>
            <span>OU</span>
          </div>

          <div className={styles.googleSlot}>
            <GoogleButton onCredential={handleGoogleCredential} width={384}>
              <button type="button" className={styles.googleBtn}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.2 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C39.9 36.9 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"
                  />
                </svg>
                Continuar com o Google
              </button>
            </GoogleButton>
          </div>
        </div>
      </div>
    </div>
  );
}
