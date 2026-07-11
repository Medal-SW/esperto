import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  useConnectGoogle,
  useGeneralRanking,
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
} from "../api/hooks";
import { Avatar } from "../components/Avatar";
import { AvatarCropModal } from "../components/AvatarCropModal";
import { GoogleButton } from "../components/GoogleButton";
import { Camera, Lock } from "lucide-react";
import styles from "./Profile.module.css";

const GoogleLogo = () => (
  <svg width="26" height="26" viewBox="0 0 48 48" aria-hidden="true">
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
);

function memberSince(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { addToast } = useToast();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const connectGoogle = useConnectGoogle();
  const ranking = useGeneralRanking("todos");
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const entry = ranking.data?.find((e) => e.user_id === user.id);
  const stats = [
    {
      icon: "🔥",
      label: "Sequência atual",
      value: String(entry?.streak ?? 0),
      bg: "rgba(251,191,36,.14)",
      color: "#fbbf24",
    },
    {
      icon: "🏆",
      label: "Posição no ranking",
      value: entry ? `#${entry.position}` : "—",
      bg: "rgba(244,63,94,.14)",
      color: "#fb7185",
    },
    {
      icon: "🎯",
      label: "Jogos registrados",
      value: String(entry?.total_games ?? 0),
      bg: "rgba(168,85,247,.14)",
      color: "#c4a3f7",
    },
    {
      icon: "⚡",
      label: "Média de tentativas",
      value: entry ? entry.avg_attempts.toFixed(1) : "—",
      bg: "rgba(52,211,153,.14)",
      color: "#6ee7b7",
    },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null);
    try {
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      await uploadAvatar.mutateAsync(file);
      await refreshUser();
      addToast("Foto atualizada!");
    } catch {
      addToast("Erro ao atualizar foto", "error");
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatar.mutateAsync();
      await refreshUser();
      addToast("Foto removida");
    } catch {
      addToast("Erro ao remover foto", "error");
    }
  };

  const handleConnectGoogle = async (credential: string) => {
    try {
      await connectGoogle.mutateAsync(credential);
      await refreshUser();
      addToast("Conta Google conectada!");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Erro ao conectar conta Google";
      addToast(msg, "error");
    }
  };

  const handleSave = async () => {
    const trimmed = displayName.trim();
    try {
      await updateProfile.mutateAsync({ display_name: trimmed || null });
      await refreshUser();
      setDirty(false);
      setSaved(true);
      addToast("Perfil atualizado!");
    } catch {
      addToast("Erro ao atualizar perfil", "error");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>Conta</div>
        <h1 className={styles.title}>Meu Perfil</h1>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={handleFileSelect}
      />

      <div className={styles.grid}>
        {/* ESQUERDA: identidade + estatísticas */}
        <div className={`${styles.col} ${styles.leftCol}`}>
          <div className={`${styles.card} ${styles.identityCard}`}>
            <div className={styles.identityBanner} />
            <button
              className={styles.avatarBtn}
              onClick={() => fileRef.current?.click()}
              title="Alterar foto"
            >
              <Avatar
                username={user.username}
                avatarUrl={user.avatar_url}
                size={84}
              />
              <span className={styles.avatarOverlay}>
                <Camera size={20} color="#fff" />
              </span>
            </button>
            <h2 className={styles.identityName}>
              {user.display_name || user.username}
            </h2>
            <div className={styles.identityHandle}>@{user.username}</div>
            <div className={styles.photoActions}>
              <button
                className={styles.ghostBtn}
                onClick={() => fileRef.current?.click()}
              >
                Alterar foto
              </button>
              {user.avatar_url && (
                <button
                  className={styles.removeBtn}
                  onClick={handleDeleteAvatar}
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          <div className={`${styles.card} ${styles.statsCard}`}>
            <div className={styles.statsTitle}>Suas estatísticas</div>
            <div>
              {stats.map((s) => (
                <div key={s.label} className={styles.statRow}>
                  <span
                    className={styles.statIcon}
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.icon}
                  </span>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statValue}>{s.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.memberSince}>
              <span>📅</span> Membro desde {memberSince(user.created_at)}
            </div>
          </div>
        </div>

        {/* DIREITA: edição + google + logout */}
        <div className={styles.col}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Editar informações</div>

            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <div className={styles.inputWrap}>
                <input className={styles.input} value={user.username} disabled />
                <span className={styles.lockIcon}>
                  <Lock size={15} />
                </span>
              </div>
              <div className={styles.hint}>
                O username é único e não pode ser alterado.
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Nickname</label>
              <input
                className={styles.input}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setDirty(true);
                  setSaved(false);
                }}
                placeholder={user.username}
                maxLength={50}
              />
              <div className={styles.hint}>
                Nome visível nos rankings e no app.
              </div>
            </div>

            <div className={styles.saveRow}>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={!dirty || updateProfile.isPending}
              >
                {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
              </button>
              {saved && (
                <span className={styles.savedMsg}>✓ Alterações salvas</span>
              )}
            </div>
          </div>

          <div className={`${styles.card} ${styles.googleCard}`}>
            <div className={styles.googleRow}>
              <div className={styles.googleInfo}>
                <GoogleLogo />
                <div>
                  <div className={styles.googleName}>Conta Google</div>
                  <div className={styles.googleSub}>
                    {user.google_linked
                      ? (user.email ?? "Conectada")
                      : "Conecte para entrar sem senha"}
                  </div>
                </div>
              </div>
              {user.google_linked ? (
                <span className={styles.badge}>
                  <span className={styles.badgeDot} />
                  Conectada
                </span>
              ) : (
                <div className={styles.googleConnect}>
                  <GoogleButton
                    text="continue_with"
                    theme="filled_black"
                    onCredential={handleConnectGoogle}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.logoutRow}>
            <span className={styles.logoutText}>
              Encerrar a sessão neste dispositivo
            </span>
            <button className={styles.logoutBtn} onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </div>

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
