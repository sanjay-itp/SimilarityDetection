import { useState } from "react";
import { api } from "../../services/api.js";
import { ErrorMessage, Field } from "../../components/ui.jsx";

/** Right-hand "New teacher account" card on User management. */
export default function TeacherAccountForm({ faculties, courses, onCreated }) {
  const [form, setForm] = useState({ name: "", email: "", faculty: faculties[0]?.code ?? "", courseIds: [], sendInvite: true });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  function toggleCourse(id) {
    setForm((f) => ({ ...f, courseIds: f.courseIds.includes(id) ? f.courseIds.filter((x) => x !== id) : [...f.courseIds, id] }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user, tempPassword } = await api.createUser({ ...form, role: "teacher" });
      setForm((f) => ({ ...f, name: "", email: "", courseIds: [] }));
      onCreated({ name: user.name, email: user.email, tempPassword });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit} noValidate aria-labelledby="teacher-form-title">
      <h2 className="card__title" id="teacher-form-title">New teacher account</h2>
      <p className="card__desc">Teachers cannot self-register. Accounts are created by an admin.</p>

      <Field label="Full name" htmlFor="t-name">
        <input className="input" id="t-name" value={form.name} onChange={set("name")} placeholder="Chandra Thapa" />
      </Field>
      <Field label="Staff email" htmlFor="t-email">
        <input className="input" id="t-email" type="email" value={form.email} onChange={set("email")} placeholder="c.thapa@ics.dev" />
      </Field>
      {faculties.length > 0 && (
        <Field label="Faculty / department" htmlFor="t-faculty">
          <select className="input" id="t-faculty" value={form.faculty} onChange={set("faculty")}>
            {faculties.map((f) => <option key={f.code} value={f.code}>{f.code} · {f.name}</option>)}
          </select>
        </Field>
      )}
      <Field label="Assign courses">
        {courses.length === 0 ? (
          <p className="help">No courses yet. Add them under Courses &amp; terms.</p>
        ) : (
          <div className="checklist">
            {courses.map((c) => (
              <label className="check" key={c.id}>
                <input type="checkbox" checked={form.courseIds.includes(c.id)} onChange={() => toggleCourse(c.id)} />
                {c.code} · {c.name}{c.teacherName ? ` (now: ${c.teacherName})` : ""}
              </label>
            ))}
          </div>
        )}
      </Field>
      <label className="check">
        <input type="checkbox" checked={form.sendInvite} onChange={set("sendInvite")} /> Send invite email with temporary password
      </label>
      <ErrorMessage error={error} />
      <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
        {busy ? "Creating…" : "Create & send invite"}
      </button>
    </form>
  );
}
