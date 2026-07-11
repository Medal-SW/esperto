import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<{ created: boolean }>;
  completeOnboarding: (username: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get<User>("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setIsLoading(false));
  }, []);

  const finishLogin = useCallback(async (accessToken: string) => {
    localStorage.setItem("token", accessToken);
    const me = await api.get<User>("/auth/me");
    setUser(me.data);
  }, []);

  const login = useCallback(async (login: string, password: string) => {
    const { data } = await api.post<{ access_token: string }>("/auth/login", {
      login,
      password,
    });
    await finishLogin(data.access_token);
  }, [finishLogin]);

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      await api.post("/auth/signup", { username, email, password });
      await login(username, password);
    },
    [login],
  );

  const loginWithGoogle = useCallback(
    async (credential: string): Promise<{ created: boolean }> => {
      const { data } = await api.post<{
        access_token: string;
        created: boolean;
      }>("/auth/google", { credential });
      await finishLogin(data.access_token);
      return { created: data.created };
    },
    [finishLogin],
  );

  const completeOnboarding = useCallback(async (username: string) => {
    const { data } = await api.post<User>("/auth/complete-onboarding", {
      username,
    });
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await api.get<User>("/auth/me");
    setUser(me.data);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        completeOnboarding,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
