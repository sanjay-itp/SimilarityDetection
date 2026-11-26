import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/** "/" sends signed-in people to their own workspace, everyone else to sign in. */
export function HomeRedirect() {
  const { user, ready } = useAuth();
  if (!ready) return <p className="loading-screen">Loading…</p>;
  return <Navigate to={user ? `/${user.role}` : "/login"} replace />;
}

/** Only lets a signed-in user with the given role through. */
export function RequireRole({ role, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <p className="loading-screen">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}
