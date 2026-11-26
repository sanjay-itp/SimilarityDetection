import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Sidebar + main area shared by all three roles.
 * nav: [{ to, label, end? }] or [{ label, disabled: true }] for screens not built yet.
 */
export default function AppShell({ role, roleLabel, nav, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={`app role-${role}`}>
      <aside className="sidebar">
        <div>
          <div className="brand">
            <span className="brand__name">Origyn</span>
            <span className="brand__role">{roleLabel}</span>
          </div>
          <nav className="nav" aria-label={roleLabel}>
            {nav.map((item) =>
              item.disabled ? (
                <span key={item.label} className="nav__item nav__item--disabled" aria-disabled="true" title="Coming soon">
                  {item.label}
                </span>
              ) : (
                <NavLink key={item.to} to={item.to} end={item.end} className="nav__item">
                  {item.label}
                </NavLink>
              )
            )}
          </nav>
        </div>
        <div className="user">
          <span className="user__name">{user?.name}</span>
          <span className="user__email">{user?.email}</span>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
