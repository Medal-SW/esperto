import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

function extractDetail(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return (detail[0] as { msg?: string })?.msg ?? "Dados inválidos";
  }
  return typeof detail === "string" ? detail : "Erro inesperado";
}

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
      setEmail("");
    } catch (err: unknown) {
      setError(extractDetail(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.showcase}>
        <div className={`${styles.blob} ${styles.blobTop}`} />
        <div className={`${styles.blob} ${styles.blobBottom}`} />
        <Logo />
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Recupere seu <span className={styles.heroAccent}>acesso.</span>
          </h1>
          <p className={styles.heroText}>
            Não deixe de registrar seus jogos de hoje. Enviaremos um link para
            você redefinir sua senha.
          </p>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formInner}>
          <div className={styles.mobileLogo}>
            <Logo />
          </div>

          <h2 className={styles.heading}>Esqueceu a senha?</h2>
          <p className={styles.sub}>
            Digite o e-mail cadastrado e enviaremos as instruções.
          </p>

          {success ? (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <div
                style={{
                  background: "rgba(52, 211, 153, 0.12)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  color: "#34d399",
                  padding: "16px",
                  borderRadius: "12px",
                  fontFamily: '"Hanken Grotesk", sans-serif',
                  marginBottom: "24px",
                }}
              >
                Link de recuperação enviado! Verifique sua caixa de entrada e a
                pasta de spam.
              </div>
              <Link
                to="/login"
                className={styles.toggleBtn}
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.fields}>
                <div>
                  <label className={styles.label}>E-mail</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu e-mail"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                className={styles.submit}
                type="submit"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          )}

          {!success && (
            <div className={styles.switch}>
              <Link to="/login" className={styles.switchLink}>
                Lembrei minha senha. Voltar ao login.
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
