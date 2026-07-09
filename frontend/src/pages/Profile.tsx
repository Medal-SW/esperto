import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useUpdateProfile, useUploadAvatar, useDeleteAvatar } from "../api/hooks";
import { Avatar } from "../components/Avatar";
import { AvatarCropModal } from "../components/AvatarCropModal";
import { Card } from "../components/Card";
import styles from "./Profile.module.css";

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  if (!user) return null;

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

  const handleSave = async () => {
    const trimmed = displayName.trim();
    try {
      await updateProfile.mutateAsync({
        display_name: trimmed || null,
      });
      await refreshUser();
      setDirty(false);
      addToast("Perfil atualizado!");
    } catch {
      addToast("Erro ao atualizar perfil", "error");
    }
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Meu Perfil</h1>

      <Card hover={false}>
        <div className={styles.avatarSection}>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={handleFileSelect}
          />
          <button
            className={styles.avatarBtn}
            onClick={() => fileRef.current?.click()}
            title="Alterar foto"
          >
            <Avatar username={user.username} avatarUrl={user.avatar_url} size={80} />
            <div className={styles.avatarOverlay}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </button>
          <div className={styles.avatarActions}>
            <button
              className={styles.avatarActionBtn}
              onClick={() => fileRef.current?.click()}
            >
              Alterar foto
            </button>
            {user.avatar_url && (
              <button
                className={styles.avatarRemoveBtn}
                onClick={handleDeleteAvatar}
              >
                Remover
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card hover={false}>
        <div className={styles.field}>
          <label className={styles.label}>Username</label>
          <input
            className={styles.input}
            value={user.username}
            disabled
          />
          <span className={styles.hint}>Não pode ser alterado</span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Nickname</label>
          <input
            className={styles.input}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setDirty(true);
            }}
            placeholder={user.username}
            maxLength={50}
          />
          <span className={styles.hint}>Nome visível nos rankings e no app</span>
        </div>

        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!dirty || updateProfile.isPending}
        >
          {updateProfile.isPending ? "Salvando..." : "Salvar"}
        </button>
      </Card>

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
