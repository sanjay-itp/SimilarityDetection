import { useEffect, useState } from "react";
import { api } from "../../services/api.js";
import Drawer from "../../components/Drawer.jsx";
import { ErrorMessage, Field, Tabs } from "../../components/ui.jsx";

const ROLES = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
];

function blank(faculties) {
  const f = faculties[0];
  return { role: "student", name: "", studentId: "", email: "", programme: f?.code ?? "", semester: f?.current ?? 1, faculty: f?.code ?? "", sendLink: true };
}

/** "New account" slide-over for any role. No automatic-course-joining message. */
export default function NewAccountDrawer({ open, onClose, faculties, onCreated }) {
  const [form, setForm] = useState(() => blank(faculties));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(blank(faculties));
      setError(null);
    }
  }, [open, faculties]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const programme = faculties.find((f) => f.code === form.programme);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user, tempPassword } = await api.createUser(form);
      onCreated({ name: user.name, email: user.email, tempPassword });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New account"
      subtitle="They can sign in as soon as you save."
      onSubmit={onSubmit}
      footer={
        <>
          <button className="btn" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        </>
      }
    >
      <Field label="Role">
        <Tabs block label="Role" items={ROLES} value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} />
      </Field>

      <div className={form.role === "student" ? "field-row" : "stack"}>
        <Field label="Full name" htmlFor="n-name">
          <input className="input" id="n-name" value={form.name} onChange={set("name")} placeholder="Priya Sharma" />
        </Field>
        {form.role === "student" && (
          <Field label="Student ID" htmlFor="n-id">
            <input className="input" id="n-id" value={form.studentId} onChange={set("studentId")} placeholder="KU-2026-014" />
          </Field>
        )}
      </div>

      <Field label="Email" htmlFor="n-email">
        <input className="input" id="n-email" type="email" value={form.email} onChange={set("email")}
          placeholder={form.role === "student" ? "name@student.ics.dev" : "name@ics.dev"} />
      </Field>

      {form.role === "student" &&
        (faculties.length === 0 ? (
          <p className="help">Add a faculty under Courses &amp; terms before creating students.</p>
        ) : (
          <div className="field-row">
            <Field label="Programme" htmlFor="n-programme">
              <select className="input" id="n-programme" value={form.programme} onChange={set("programme")}>
                {faculties.map((f) => <option key={f.code} value={f.code}>{f.code}</option>)}
              </select>
            </Field>
            <Field label="Semester" htmlFor="n-semester">
              <select className="input" id="n-semester" value={form.semester} onChange={set("semester")}>
                {Array.from({ length: programme?.semesters ?? 8 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>Semester {n}</option>
                ))}
              </select>
            </Field>
          </div>
        ))}

      {form.role === "teacher" && faculties.length > 0 && (
        <Field label="Faculty / department" htmlFor="n-faculty">
          <select className="input" id="n-faculty" value={form.faculty} onChange={set("faculty")}>
            {faculties.map((f) => <option key={f.code} value={f.code}>{f.code} · {f.name}</option>)}
          </select>
        </Field>
      )}

      <label className="check">
        <input type="checkbox" checked={form.sendLink} onChange={set("sendLink")} />
        Email them a sign-in link (needs a mail server; the temporary password is also shown here)
      </label>

      <ErrorMessage error={error} />
    </Drawer>
  );
}
