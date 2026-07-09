import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useUploadAvatar } from "../api/hooks";
import { Avatar } from "./Avatar";
import { AvatarCropModal } from "./AvatarCropModal";
import { LayoutGrid, PlusCircle, Trophy, BarChart3, ChevronDown, Camera, User, Sun, Moon, LogOut } from "lucide-react";
import styles from "./Layout.module.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutGrid size={18} /> },
  { to: "/submit", label: "Registrar", icon: <PlusCircle size={18} /> },
  { to: "/ranking", label: "Ranking", icon: <Trophy size={18} /> },
  { to: "/history", label: "Desempenho", icon: <BarChart3 size={18} /> },
];

export function Layout() {
  const { user, isLoading, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const uploadAvatar = useUploadAvatar();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  useEffect(() => {
    setDropdownOpen(false);
    setConfirmingLogout(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setConfirmingLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>
        Carregando...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

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

  const handleLogout = () => {
    logout();
    addToast("Até logo!", "info");
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.topbar}>
        <span className={styles.brand}>Esperto</span>

        <nav className={styles.desktopNav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div className={styles.userMenu} ref={dropdownRef}>
          <button
            className={styles.userMenuBtn}
            onClick={() => {
              setDropdownOpen((v) => !v);
              setConfirmingLogout(false);
            }}
          >
            <Avatar username={user.username} avatarUrl={user.avatar_url} size={32} />
            <span className={styles.userMenuName}>{user.display_name || user.username}</span>
            <ChevronDown size={14} />
          </button>

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  onChange={handleFileSelect}
                />
                <button
                  className={styles.dropdownAvatarBtn}
                  onClick={() => fileRef.current?.click()}
                  title="Alterar foto"
                >
                  <Avatar username={user.username} avatarUrl={user.avatar_url} size={48} />
                  <div className={styles.cameraOverlay}>
                    <Camera size={16} color="#fff" />
                  </div>
                </button>
                <div>
                  <p className={styles.dropdownName}>{user.display_name || user.username}</p>
                  <p className={styles.dropdownHint}>@{user.username}</p>
                </div>
              </div>

              <div className={styles.dropdownDivider} />

              <button
                className={styles.dropdownAction}
                onClick={() => navigate("/profile")}
              >
                <User size={16} />
                Meu perfil
              </button>

              <button
                className={styles.dropdownAction}
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Tema claro" : "Tema escuro"}
              </button>

              <div className={styles.dropdownDivider} />

              {confirmingLogout ? (
                <div className={styles.logoutConfirm}>
                  <p className={styles.logoutConfirmText}>Tem certeza que deseja sair?</p>
                  <div className={styles.logoutConfirmActions}>
                    <button
                      className={styles.logoutConfirmYes}
                      onClick={handleLogout}
                    >
                      Sim, sair
                    </button>
                    <button
                      className={styles.logoutConfirmNo}
                      onClick={() => setConfirmingLogout(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={styles.dropdownAction}
                  onClick={() => setConfirmingLogout(true)}
                >
                  <LogOut size={16} />
                  Sair
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ""}`
            }
          >
            <span className={styles.bottomNavIcon}>{item.icon}</span>
            <span className={styles.bottomNavLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

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
