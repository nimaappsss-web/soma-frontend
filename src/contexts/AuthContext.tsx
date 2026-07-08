import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";

import {
  tokenStorage,
  refreshTokenStorage,
  userIDStorage,
  roleStorage,
  userStorage,
  storage,
} from "../utils/storage";
import type { User, LoginResponse } from "../features/auth/types";
import { authApi } from "../services/auth";
import { clearUserData } from "../db/db";
import type { AxiosError } from "axios";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginResponse) => void;
  setTokens: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_EVENT = "nima:auth-change";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenStorage.getToken();
    const refreshToken = refreshTokenStorage.get();

    if (!token && !refreshToken) {
      setIsLoading(false);
      return;
    }

    const cached = userStorage.get();
    if (cached) {
      setUser(cached);
      setIsLoading(false);
    }

    const mergeUser = (fromServer: User) => {
      const merged = { ...cached, ...fromServer };
      userStorage.set(merged);
      setUser(merged);
    };

    if (token) {
      authApi
        .me()
        .then(mergeUser)
        .catch((err) => {
          const axiosErr = err as AxiosError;
          const st = axiosErr.response?.status;
          if (st === 401 || st === 403) {
            if (refreshToken) {
              authApi
                .refresh(refreshToken)
                .then((res) => {
                  tokenStorage.setToken(res.accessToken);
                  return authApi.me();
                })
                .then(mergeUser)
                .catch(() => {
                  storage.clear();
                  setUser(null);
                });
            } else {
              storage.clear();
              setUser(null);
            }
          } else if (!cached) {
            setIsLoading(false);
          }
        })
        .finally(() => {
          if (!cached) setIsLoading(false);
        });
    } else if (refreshToken) {
      authApi
        .refresh(refreshToken)
        .then((res) => {
          tokenStorage.setToken(res.accessToken);
          return authApi.me();
        })
        .then(mergeUser)
        .catch(() => {
          storage.clear();
          setUser(null);
        })
        .finally(() => {
          if (!cached) setIsLoading(false);
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
    if (data.refreshToken) refreshTokenStorage.set(data.refreshToken);
    userIDStorage.setUserID(data.user.id);
    roleStorage.setRole(data.user.role);
    userStorage.set(data.user);
    setUser(data.user);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }, []);

  const setTokens = useCallback(
    (accessToken: string, refreshToken: string, userData: User) => {
      tokenStorage.setToken(accessToken);
      if (refreshToken) refreshTokenStorage.set(refreshToken);
      userIDStorage.setUserID(userData.id);
      roleStorage.setRole(userData.role);
      userStorage.set(userData);
      setUser(userData);
      window.dispatchEvent(new Event(AUTH_EVENT));
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = refreshTokenStorage.get();
    try {
      await authApi.logout(refreshToken);
    } catch {
      /* ignore */
    }
    await clearUserData();
    storage.clear();
    setUser(null);
    window.dispatchEvent(new Event(AUTH_EVENT));
    navigate("/login");
  }, [navigate]);

  return (
    <AuthContext
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        setTokens,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
