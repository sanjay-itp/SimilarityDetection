import { useState } from "react";
import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSetup } from "../../components/SetupGate.jsx";
import "../../styles/auth.css";

/**
 * First-run setup. Shown only while no administrator exists. The person who
 * hosts Origyn on the institution's server fills this in and becomes the admin.
 */
export default function Setup() {
  const { login } = useAuth();
  const { refresh } = useSetup();
  const [form, setForm] = useState({
    institutionName: "", department: "", adminName: "", email: "", password: "", confirm: "", loadDemo: true,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.completeSetup(form);
      await login(form.email, form.password, true);
      await refresh(); // the setup gate now sends the new admin to /admin
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="role-auth">
      <form className="card auth-dialog auth-dialog--wide" onSubmit={onSubmit} noValidate aria-labelledby="setup-title">
        <div className="auth-dialog__header">
          <span className="auth-dialog__brand">Origyn</span>
          <h1 className="auth-dialog__title" id="setup-title">Set up Origyn</h1>
          <p className="auth-dialog__intro">
            You are hosting Origyn for your institution. The account you create here is the administrator.
            You will add teachers and students after this step.
          </p>
        </div>

        <p className="auth-section">Institution</p>
        <div className="field">
          <label className="field__label" htmlFor="institutionName">Institution name</label>
          <input className="input" id="institutionName" value={form.institutionName} onChange={set("institutionName")} placeholder="Kathmandu University" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="department">Department (optional)</label>
          <input className="input" id="department" value={form.department} onChange={set("department")} placeholder="Dept. of STEAM Education" />
        </div>

        <p className="auth-section">Administrator account</p>
        <div className="field">
          <label className="field__label" htmlFor="adminName">Your full name</label>
          <input className="input" id="adminName" value={form.adminName} onChange={set("adminName")} autoComplete="name" />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="setup-email">Email</label>
          <input className="input" id="setup-email" type="email" value={form.email} onChange={set("email")} autoComplete="username" placeholder="admin@ics.dev" />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor="setup-password">Password</label>
            <input className="input" id="setup-password" type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="setup-confirm">Confirm password</label>
            <input className="input" id="setup-confirm" type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
          </div>
        </div>
        <p className="help">At least 8 characters.</p>

        <label className="check">
          <input type="checkbox" checked={form.loadDemo} onChange={set("loadDemo")} />
          Load demo data (sample courses, teachers and students for trying Origyn out)
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
          {busy ? "Setting up…" : "Finish setup"}
        </button>
      </form>
      <p className="auth-footer">Origyn runs on your institution’s own server. Nothing is sent to third parties.</p>
    </main>
  );
}
