import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);
const KEY = "origyn.session";

function storedId() {
  return localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = storedId();
    if (!id) {
      setReady(true);
      return;
    }
    api
      .getUser(id)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(KEY);
        sessionStorage.removeItem(KEY);
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password, remember = true) => {
    const u = await api.login(email, password);
    (remember ? localStorage : sessionStorage).setItem(KEY, u.id);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
