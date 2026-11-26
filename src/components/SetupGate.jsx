import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../services/api.js";

const SetupContext = createContext(null);

/**
 * First run: until an administrator account exists, every route goes to
 * /setup. The person hosting Origyn creates that admin account.
 */
export default function SetupGate({ children }) {
  const [status, setStatus] = useState(null);
  const location = useLocation();

  const refresh = useCallback(async () => {
    const s = await api.getSetupStatus();
    setStatus(s);
    return s;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!status) return <p className="loading-screen">Loading…</p>;

  const onSetup = location.pathname === "/setup";
  let content = children;
  if (status.needsSetup && !onSetup) content = <Navigate to="/setup" replace />;
  if (!status.needsSetup && onSetup) content = <Navigate to="/" replace />;

  return <SetupContext.Provider value={{ status, refresh }}>{content}</SetupContext.Provider>;
}

export function useSetup() {
  return useContext(SetupContext);
}
