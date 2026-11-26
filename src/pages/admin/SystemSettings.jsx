import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSetup } from "../../components/SetupGate.jsx";
import { ErrorMessage, Field, Loading, Notice, PageHeader, Tag } from "../../components/ui.jsx";
import AccountModal from "./AccountModal.jsx";
import { download } from "../../utils/format.js";

const ALL_FORMATS = [".docx", ".pdf", ".txt"];

export default function SystemSettings() {
  const { data, loading, error } = useAsync(() => api.getSettings(), []);
  const admins = useAsync(() => api.listUsers(), []);
  const [adminOpen, setAdminOpen] = useState(false);
  const { logout } = useAuth();
  const { refresh } = useSetup();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (data) {
      setForm({
        institutionName: data.institution?.name ?? "",
        department: data.institution?.department ?? "",
        ...data.settings,
      });
    }
  }, [data]);

  if (loading || !form) return error ? <ErrorMessage error={error} /> : <Loading />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleFormat = (fmt) =>
    setForm((f) => ({ ...f, formats: f.formats.includes(fmt) ? f.formats.filter((x) => x !== fmt) : [...f.formats, fmt] }));

  async function save(e) {
    e.preventDefault();
    setSaveError(null);
    try {
      await api.updateSettings(form);
      setNotice("Settings saved. New assignments use these defaults.");
    } catch (err) {
      setSaveError(err);
    }
  }

  async function exportData() {
    const dump = await api.exportData();
    download(`origyn-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(dump, null, 2), "application/json");
  }

  async function reset() {
    const answer = window.prompt('This deletes every account, course and submission on this server. Type RESET to confirm.');
    if (answer !== "RESET") return;
    await api.resetAll();
    logout();
    await refresh();
    navigate("/setup", { replace: true });
  }

  return (
    <>
      <PageHeader title="System settings" subtitle="Defaults for this Origyn server" />
      <Notice onClose={() => setNotice("")}>{notice}</Notice>

      <div className="layout-side settings-layout">
        <form className="card form" onSubmit={save} noValidate aria-labelledby="settings-title">
          <h2 className="card__title" id="settings-title">Institution &amp; defaults</h2>
          <div className="field-row">
            <Field label="Institution name" htmlFor="s-inst"><input className="input" id="s-inst" value={form.institutionName} onChange={set("institutionName")} /></Field>
            <Field label="Department" htmlFor="s-dept"><input className="input" id="s-dept" value={form.department} onChange={set("department")} /></Field>
          </div>
          <div className="field-row">
            <Field label="Default flagging threshold (%)" htmlFor="s-threshold">
              <input className="input" id="s-threshold" type="number" min="0" max="100" value={form.threshold} onChange={set("threshold")} />
            </Field>
            <Field label="Max upload size (MB)" htmlFor="s-size">
              <input className="input" id="s-size" type="number" min="1" max="100" value={form.maxUploadMb} onChange={set("maxUploadMb")} />
            </Field>
          </div>
          <Field label="Accepted submission formats">
            <div className="tags">
              {ALL_FORMATS.map((fmt) => (
                <label className="check" key={fmt} style={{ marginRight: 12 }}>
                  <input type="checkbox" checked={form.formats.includes(fmt)} onChange={() => toggleFormat(fmt)} /> {fmt}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Nightly backup" htmlFor="s-backup" help="When the server should run its backup job.">
            <input className="input" id="s-backup" type="time" value={form.backupTime} onChange={set("backupTime")} />
          </Field>
          <ErrorMessage error={saveError} />
          <div className="form-actions"><button className="btn btn--primary" type="submit">Save settings</button></div>
        </form>

        <section className="card danger-zone" aria-labelledby="server-title">
          <h2 className="card__title" id="server-title">This server</h2>
          <p className="card__desc">
            You host Origyn for your institution, so you are its administrator. Download a backup before upgrades.
          </p>
          <button className="btn btn--block" type="button" onClick={exportData}>Download backup (.json)</button>
          <hr className="divider" />
          <p className="card__desc">Reset removes all data, including demo data, and returns to first-run setup.</p>
          <button className="btn btn--block btn--danger" type="button" onClick={reset}>Reset Origyn</button>
        </section>
      </div>

      <section className="card" aria-labelledby="admins-title">
        <div className="card__head">
          <h2 className="card__title" id="admins-title">Administrators</h2>
          <button className="btn btn--small" type="button" onClick={() => setAdminOpen(true)}>Add administrator</button>
        </div>
        {admins.data && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {admins.data.users.filter((u) => u.role === "admin").map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><Tag strong={u.status === "invited"}>{u.status === "invited" ? "Invited" : "Active"}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AccountModal role="admin" open={adminOpen} onClose={() => setAdminOpen(false)} onCreated={admins.reload} />
    </>
  );
}
