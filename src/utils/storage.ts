import Cookies from "js-cookie";

const STORAGE_PREFIX = "NIMA_";

export const tokenStorage = {
  getToken: () => {
    return Cookies.get(`${STORAGE_PREFIX}TOKEN`) as string;
  },

  setToken: (token: string) => {
    Cookies.set(`${STORAGE_PREFIX}TOKEN`, token);
  },

  clearToken: () => {
    Cookies.remove(`${STORAGE_PREFIX}TOKEN`);
  },
};

export const userIDStorage = {
  getUserID: () => {
    return Cookies.get(`${STORAGE_PREFIX}USER_ID`) as string;
  },

  setUserID: (userID: string) => {
    Cookies.set(`${STORAGE_PREFIX}USER_ID`, userID);
  },

  clearUserID: () => {
    Cookies.remove(`${STORAGE_PREFIX}USER_ID`);
  },
};

export const roleStorage = {
  getRole: () => {
    return Cookies.get(`${STORAGE_PREFIX}ROLE`) as string;
  },

  setRole: (role: string) => {
    Cookies.set(`${STORAGE_PREFIX}ROLE`, role);
  },

  clearRole: () => {
    Cookies.remove(`${STORAGE_PREFIX}ROLE`);
  },
};


export const refreshTokenStorage = {
  getRefreshToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`${STORAGE_PREFIX}REFRESH_TOKEN`);
    }
    return null;
  },

  setRefreshToken: (refreshToken: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`${STORAGE_PREFIX}REFRESH_TOKEN`, refreshToken);
    }
  },

  clearRefreshToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${STORAGE_PREFIX}REFRESH_TOKEN`);
    }
  },
};

export const storage = {
  clear: () => {
    tokenStorage.clearToken();
    userIDStorage.clearUserID();
    roleStorage.clearRole();
    refreshTokenStorage.clearRefreshToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${STORAGE_PREFIX}PROFILE`);
      localStorage.removeItem(`${STORAGE_PREFIX}TOKEN_EXPIRES_AT`);
      localStorage.removeItem(`${STORAGE_PREFIX}REFRESH_EXPIRES_AT`);
    }
  },
};
