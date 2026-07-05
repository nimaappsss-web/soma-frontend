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
  userIDStorage,
  roleStorage,
  userStorage,
  loginTimestampStorage,
  storage,
} from "../utils/storage";
import { authApi } from "../services/auth";
import type { User, LoginResponse } from "../features/auth/types";
import type { AxiosError } from "axios";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginResponse) => void;
  setTokens: (accessToken: string, user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_EVENT = "nima:auth-change";
const DAYS_3_MS = 3 * 24 * 60 * 60 * 1000;

function isSessionExpired() {
  const ts = loginTimestampStorage.get();
  return ts > 0 && Date.now() - ts > DAYS_3_MS;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token) {
      if (isSessionExpired()) {
        storage.clear();
        setIsLoading(false);
        return;
      }
      authApi
        .me()
        .then((user) => {
          userStorage.set(user);
          setUser(user);
        })
        .catch((err) => {
          const axiosErr = err as AxiosError;
          if (axiosErr.response?.status === 401) {
            storage.clear();
            setUser(null);
          } else {
            const cached = userStorage.get();
            if (cached) setUser(cached);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
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
    userIDStorage.setUserID(data.user.id);
    roleStorage.setRole(data.user.role);
    userStorage.set(data.user);
    loginTimestampStorage.set(Date.now());
    setUser(data.user);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }, []);

  const setTokens = useCallback((accessToken: string, userData: User) => {
    tokenStorage.setToken(accessToken);
    userIDStorage.setUserID(userData.id);
    roleStorage.setRole(userData.role);
    userStorage.set(userData);
    loginTimestampStorage.set(Date.now());
    setUser(userData);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
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
