import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token de recuperação ausente ou inválido.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: unknown) {
      setError(extractDetail(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.formSide} style={{ flex: 1 }}>
          <div className={styles.formInner} style={{ textAlign: "center" }}>
            <Logo />
            <h2 className={styles.heading} style={{ marginTop: "24px" }}>
              Link inválido
            </h2>
            <p className={styles.sub}>
              O link de recuperação parece estar quebrado ou incompleto.
            </p>
            <Link
              to="/forgot-password"
              className={styles.submit}
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.showcase}>
        <div className={`${styles.blob} ${styles.blobTop}`} />
        <div className={`${styles.blob} ${styles.blobBottom}`} />
        <Logo />
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Quase <span className={styles.heroAccent}>pronto.</span>
          </h1>
          <p className={styles.heroText}>
            Crie uma senha forte e volte a dominar o ranking entre seus amigos.
          </p>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formInner}>
          <div className={styles.mobileLogo}>
            <Logo />
          </div>

          <h2 className={styles.heading}>Nova senha</h2>
          <p className={styles.sub}>Escolha sua nova senha de acesso.</p>

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
                Senha atualizada com sucesso! Redirecionando para o login...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.fields}>
                <div>
                  <label className={styles.label}>Nova senha</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      className={styles.input}
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="digite a nova senha"
                      autoFocus
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
                </div>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                className={styles.submit}
                type="submit"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Redefinir senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
