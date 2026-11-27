import { useEffect, useState } from "react";
import { api } from "../../services/api.js";
import Modal from "../../components/Modal.jsx";
import { ErrorMessage, Field } from "../../components/ui.jsx";
import { roman } from "../../utils/format.js";

const COPY = {
  student: { title: "Add student", subtitle: "They can sign in as soon as you save.", submit: "Create student" },
  teacher: { title: "Add teacher", subtitle: "Teachers cannot self-register. You create their account.", submit: "Create teacher" },
  admin: { title: "Add administrator", subtitle: "Administrators manage accounts, courses and settings.", submit: "Create administrator" },
};

function blank(role, faculties) {
  const f = faculties[0];
  return {
    role, name: "", email: "", studentId: "",
    programme: f?.code ?? "", semester: f?.current ?? 1, faculty: f?.code ?? "",
    courseIds: [], sendInvite: true,
  };
}

/**
 * Popup form for creating one account. role is fixed by the page that opens it
 * (Students page -> student, Teachers page -> teacher). After saving it shows
 * the one-time temporary password, with "Add another" and "Done".
 */
export default function AccountModal({ role, open, onClose, faculties = [], courses = [], onCreated }) {
  const [form, setForm] = useState(() => blank(role, faculties));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [mail, setMail] = useState(null); // { state: "sending" | "sent" | "failed", message? }
  const copy = COPY[role];

  useEffect(() => {
    if (open) {
      setForm(blank(role, faculties));
      setError(null);
      setCreated(null);
      setMail(null);
    }
    // Only reset when the popup opens, not when the list behind it reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role]);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const toggleCourse = (id) =>
    setForm((f) => ({ ...f, courseIds: f.courseIds.includes(id) ? f.courseIds.filter((x) => x !== id) : [...f.courseIds, id] }));
  const programme = faculties.find((f) => f.code === form.programme);

  async function onSubmit(e) {
    e.preventDefault();
    if (created) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.createUser(form);
      setCreated(result);
      onCreated?.(result);
      if (form.sendInvite && (role === "student" || role === "teacher")) emailDetails(result);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function emailDetails(result) {
    setMail({ state: "sending" });
    try {
      await api.sendAccountEmail({ role, name: result.user.name, email: result.user.email, tempPassword: result.tempPassword });
      setMail({ state: "sent" });
    } catch (err) {
      setMail({ state: "failed", message: err.message });
    }
  }

  function addAnother() {
    setForm(blank(role, faculties));
    setCreated(null);
    setError(null);
    setMail(null);
  }

  if (created) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Account created"
        subtitle={mail?.state === "sent" ? "The details below were emailed to them. The password is shown only once." : "Share the temporary password with them. It is shown only once."}
        onSubmit={(e) => e.preventDefault()}
        footer={
          <>
            <button className="btn" type="button" onClick={addAnother}>Add another</button>
            <button className="btn btn--primary" type="button" onClick={onClose}>Done</button>
          </>
        }
      >
        <dl className="summary">
          <div><dt>Name</dt><dd>{created.user.name}</dd></div>
          <div><dt>Email</dt><dd>{created.user.email}</dd></div>
          {created.user.studentId && <div><dt>Student ID</dt><dd>{created.user.studentId}</dd></div>}
          <div><dt>Temporary password</dt><dd><code>{created.tempPassword}</code></dd></div>
          {mail && (
            <div>
              <dt>Account email</dt>
              <dd>
                {mail.state === "sending" && "Sending…"}
                {mail.state === "sent" && `Sent to ${created.user.email}`}
                {mail.state === "failed" && <span className="error">Not sent. {mail.message}</span>}
              </dd>
            </div>
          )}
        </dl>
        {mail?.state === "failed" && (
          <button className="btn btn--small" type="button" onClick={() => emailDetails(created)}>Try sending again</button>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.title}
      subtitle={copy.subtitle}
      onSubmit={onSubmit}
      footer={
        <>
          <button className="btn" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? "Creating…" : copy.submit}</button>
        </>
      }
    >
      <div className={role === "student" ? "field-row" : "stack"}>
        <Field label="Full name" htmlFor="acc-name">
          <input className="input" id="acc-name" value={form.name} onChange={set("name")}
            placeholder={role === "student" ? "Priya Sharma" : "Chandra Thapa"} autoComplete="off" />
        </Field>
        {role === "student" && (
          <Field label="Student ID" htmlFor="acc-id">
            <input className="input" id="acc-id" value={form.studentId} onChange={set("studentId")} placeholder="KU-2026-014" />
          </Field>
        )}
      </div>

      <Field label={role === "student" ? "Email" : "Staff email"} htmlFor="acc-email">
        <input className="input" id="acc-email" type="email" value={form.email} onChange={set("email")}
          placeholder={role === "student" ? "name@student.ics.dev" : "name@ics.dev"} autoComplete="off" />
      </Field>

      {role === "student" &&
        (faculties.length === 0 ? (
          <p className="help">Add a faculty under Courses &amp; terms before adding students.</p>
        ) : (
          <div className="field-row">
            <Field label="Programme" htmlFor="acc-programme">
              <select className="input" id="acc-programme" value={form.programme} onChange={set("programme")}>
                {faculties.map((f) => <option key={f.code} value={f.code} title={f.name}>{f.code}</option>)}
              </select>
            </Field>
            <Field label="Semester" htmlFor="acc-semester">
              <select className="input" id="acc-semester" value={form.semester} onChange={set("semester")}>
                {Array.from({ length: programme?.semesters ?? 8 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>Semester {roman(n)}</option>
                ))}
              </select>
            </Field>
          </div>
        ))}

      {role === "teacher" && (
        <>
          {faculties.length > 0 && (
            <Field label="Faculty / department" htmlFor="acc-faculty">
              <select className="input" id="acc-faculty" value={form.faculty} onChange={set("faculty")}>
                {faculties.map((f) => <option key={f.code} value={f.code}>{f.code} · {f.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Assign courses (optional)">
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
        </>
      )}

      {role !== "admin" && (
        <label className="check">
          <input type="checkbox" checked={form.sendInvite} onChange={set("sendInvite")} />
          Email them their name, email and temporary password
        </label>
      )}

      <ErrorMessage error={error} />
    </Modal>
  );
}
