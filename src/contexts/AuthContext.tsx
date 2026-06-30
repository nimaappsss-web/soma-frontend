import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { tokenStorage, userIDStorage, roleStorage, storage } from "../utils/storage";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
  schoolName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (token) {
      setUser({
        id: userIDStorage.getUserID() || "",
        name: "",
        email: "",
        role: roleStorage.getRole() || "",
      });
    }
  }, []);

  const login = (userData: User) => {
    tokenStorage.setToken("mock-token");
    userIDStorage.setUserID(userData.id);
    roleStorage.setRole(userData.role);
    setUser(userData);
  };

  const logout = () => {
    storage.clear();
    setUser(null);
  };

  return (
    <AuthContext value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
