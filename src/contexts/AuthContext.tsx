import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { tokenStorage, refreshTokenStorage, userIDStorage, roleStorage, storage } from "../utils/storage";
import { authApi } from "../services/auth";
import type { User, LoginResponse } from "../features/auth/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  setTokens: (accessToken: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_EVENT = "nima:auth-change";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token) {
      authApi.me()
        .then(setUser)
        .catch(() => {
          storage.clear();
          setUser(null);
        });
    }

    const onAuthChange = () => {
      const t = tokenStorage.getToken();
      if (!t) setUser(null);
    };
    window.addEventListener(AUTH_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_EVENT, onAuthChange);
  }, []);

  const login = useCallback((data: LoginResponse) => {
    tokenStorage.setToken(data.accessToken);
    refreshTokenStorage.setRefreshToken(data.refreshToken);
    userIDStorage.setUserID(data.user.id);
    roleStorage.setRole(data.user.role);
    setUser(data.user);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }, []);

  const setTokens = useCallback((accessToken: string, userData: User) => {
    tokenStorage.setToken(accessToken);
    userIDStorage.setUserID(userData.id);
    roleStorage.setRole(userData.role);
    setUser(userData);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }, []);

  const logout = useCallback(async () => {
    const refresh = refreshTokenStorage.getRefreshToken();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch { /* ignore */ }
    }
    storage.clear();
    setUser(null);
    window.dispatchEvent(new Event(AUTH_EVENT));
    navigate("/login");
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    try {
      const u = await authApi.me();
      setUser(u);
    } catch {
      storage.clear();
      setUser(null);
    }
  }, []);

  return (
      <AuthContext value={{ user, isAuthenticated: !!user, login, setTokens, logout, refreshUser }}>
      {children}
    </AuthContext>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
