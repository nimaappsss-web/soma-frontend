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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginResponse) => void;
  setTokens: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_EVENT = "soma:auth-change";

const cachedUser = userStorage.get();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenStorage.getToken();
    const refreshToken = refreshTokenStorage.get();

    if (!token && !refreshToken) {
      setIsLoading(false);
      return;
    }

    const mergeUser = (fromServer: User) => {
      const merged = { ...cachedUser, ...fromServer };
      userStorage.set(merged);
      setUser(merged);
    };

    const isServerRejection = (err: unknown) =>
      !!(err as { response?: { status?: number } }).response?.status;

    if (token) {
      authApi
        .me()
        .then(mergeUser)
        .catch((err) => {
          if (!isServerRejection(err)) {
            if (!cachedUser) setIsLoading(false);
            return;
          }

          const st = (err as { response: { status: number } }).response.status;
          if (st === 401 || st === 403) {
            if (refreshToken) {
              authApi
                .refresh(refreshToken)
                .then((res) => {
                  tokenStorage.setToken(res.accessToken);
                  return authApi.me();
                })
                .then(mergeUser)
                .catch((refreshErr) => {
                  if (isServerRejection(refreshErr)) {
                    storage.clear();
                    setUser(null);
                  } else if (!cachedUser) {
                    setIsLoading(false);
                  }
                })
                .finally(() => {
                  if (!cachedUser) setIsLoading(false);
                });
            } else {
              storage.clear();
              setUser(null);
              if (!cachedUser) setIsLoading(false);
            }
          } else if (!cachedUser) {
            setIsLoading(false);
          }
        })
        .finally(() => {
          if (!cachedUser) setIsLoading(false);
        });
    } else if (refreshToken) {
      authApi
        .refresh(refreshToken)
        .then((res) => {
          tokenStorage.setToken(res.accessToken);
          return authApi.me();
        })
        .then(mergeUser)
        .catch((refreshErr) => {
          if (isServerRejection(refreshErr)) {
            storage.clear();
            setUser(null);
          }
        })
        .finally(() => {
          if (!cachedUser) setIsLoading(false);
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
