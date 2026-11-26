import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSetup } from "../../components/SetupGate.jsx";
import "../../styles/auth.css";

export default function Login() {
  const { user, login } = useAuth();
  const { status } = useSetup();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={`/${user.role}`} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const u = await login(email, password, remember);
      navigate(`/${u.role}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const institution = status?.institution;

  return (
    <main className="role-auth">
      <form className="card auth-dialog" onSubmit={onSubmit} noValidate aria-labelledby="login-title">
        <div className="auth-dialog__header">
          <span className="auth-dialog__brand">Origyn</span>
          <h1 className="auth-dialog__title" id="login-title">Sign in</h1>
          <p className="auth-dialog__intro">Use the account your administrator created for you.</p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="email">Email</label>
          <input
            className="input" id="email" type="email" autoComplete="username"
            placeholder="name@student.ics.dev" value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <div className="field__label">
            <label htmlFor="password">Password</label>
            <span className="muted" title="Your administrator can give you a new temporary password.">Forgot password? Ask your admin.</span>
          </div>
          <div className="input-group">
            <input
              className="input" id="password" type={showPassword ? "text" : "password"}
              autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="link-btn input-group__suffix" type="button"
              aria-pressed={showPassword} onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Stay signed in
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="auth-dialog__hint">No account? Ask your administrator.</p>
      </form>

      {institution && (
        <p className="auth-footer">
          {institution.name}
          {institution.department ? ` · ${institution.department}` : ""}
        </p>
      )}
    </main>
  );
}
