import Cookies from "js-cookie";

const STORAGE_PREFIX = "NIMA_";

export const tokenStorage = {
  getToken: () => Cookies.get(`${STORAGE_PREFIX}TOKEN`) as string,
  setToken: (token: string) => Cookies.set(`${STORAGE_PREFIX}TOKEN`, token),
  clearToken: () => Cookies.remove(`${STORAGE_PREFIX}TOKEN`),
};

export const userIDStorage = {
  getUserID: () => Cookies.get(`${STORAGE_PREFIX}USER_ID`) as string,
  setUserID: (userID: string) => Cookies.set(`${STORAGE_PREFIX}USER_ID`, userID),
  clearUserID: () => Cookies.remove(`${STORAGE_PREFIX}USER_ID`),
};

export const roleStorage = {
  getRole: () => Cookies.get(`${STORAGE_PREFIX}ROLE`) as string,
  setRole: (role: string) => Cookies.set(`${STORAGE_PREFIX}ROLE`, role),
  clearRole: () => Cookies.remove(`${STORAGE_PREFIX}ROLE`),
};

const PROFILE_KEY = `${STORAGE_PREFIX}PROFILE`;

export const userStorage = {
  get: () => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set: (user: unknown) => localStorage.setItem(PROFILE_KEY, JSON.stringify(user)),
  clear: () => localStorage.removeItem(PROFILE_KEY),
};

const EXPIRES_KEY = `${STORAGE_PREFIX}TOKEN_EXPIRES_AT`;

export const loginTimestampStorage = {
  get: () => {
    const raw = localStorage.getItem(EXPIRES_KEY);
    return raw ? Number(raw) : 0;
  },
  set: (timestamp: number) => localStorage.setItem(EXPIRES_KEY, String(timestamp)),
  clear: () => localStorage.removeItem(EXPIRES_KEY),
};

export const storage = {
  clear: () => {
    tokenStorage.clearToken();
    userIDStorage.clearUserID();
    roleStorage.clearRole();
    userStorage.clear();
    loginTimestampStorage.clear();
  },
};
