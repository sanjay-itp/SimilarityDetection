import { useEffect, useState } from "react";
import { api } from "../../services/api.js";
import FileUpload from "../../components/FileUpload.jsx";
import { ErrorMessage, Field } from "../../components/ui.jsx";

function blank(settings) {
  return { id: null, title: "", instructions: "", file: null, dueDate: "", dueTime: "23:59", threshold: settings.threshold, references: [] };
}

/**
 * New / edit assignment form. Teachers can attach the assignment itself as a
 * .pdf or .docx file, which students then see on the submit page.
 */
export default function AssignmentForm({ teacherId, courseId, settings, editing, onSaved, onCancelEdit }) {
  const [form, setForm] = useState(() => blank(settings));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError(null);
    setForm(editing ? { ...blank(settings), ...editing, references: [] } : blank(settings));
  }, [editing, settings]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(publish) {
    setBusy(true);
    setError(null);
    try {
      const saved = await api.saveAssignment(teacherId, { ...form, courseId, publish });
      setForm(blank(settings));
      onSaved(saved, publish);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const isEdit = Boolean(form.id);
  const isPublished = isEdit && editing?.status !== "draft";

  return (
    <form
      className="card form"
      id="assignment-form"
      noValidate
      aria-labelledby="assignment-form-title"
      onSubmit={(e) => {
        e.preventDefault();
        save(true);
      }}
    >
      <div className="card__head">
        <h2 className="card__title" id="assignment-form-title">{isEdit ? "Edit assignment" : "New assignment"}</h2>
        {isEdit && <button type="button" className="link-btn" onClick={onCancelEdit}>Cancel edit</button>}
      </div>

      <Field label="Title" htmlFor="a-title">
        <input className="input" id="a-title" value={form.title} onChange={set("title")} placeholder="Essay 3: Social Media & Debate" />
      </Field>

      <Field label="Instructions" htmlFor="a-instructions">
        <textarea className="input" id="a-instructions" value={form.instructions} onChange={set("instructions")} placeholder="Write a 300-word argumentative essay on…" />
      </Field>

      <Field label="Assignment file">
        <FileUpload
          accept=".pdf,.docx"
          maxMb={settings.maxUploadMb}
          title="Upload assignment file"
          hint={`.pdf or .docx · max ${settings.maxUploadMb} MB`}
          file={form.file}
          onFile={(file) => setForm((f) => ({ ...f, file: file ? { name: file.name, size: file.size } : null }))}
          fileNote="students can download it"
        />
      </Field>

      <div className="field-row">
        <Field label="Due date" htmlFor="a-date">
          <input className="input" id="a-date" type="date" value={form.dueDate} onChange={set("dueDate")} />
        </Field>
        <Field label="Due time" htmlFor="a-time">
          <input className="input" id="a-time" type="time" value={form.dueTime} onChange={set("dueTime")} />
        </Field>
      </div>

      <Field label="Flagging threshold" htmlFor="a-threshold" aside={<strong>{form.threshold}%</strong>}
        help={`Pairs scoring ${form.threshold}% or more go to Pending; below are cleared.`}>
        <input
          className="range" id="a-threshold" type="range" min="0" max="100" step="1"
          value={form.threshold} style={{ "--fill": `${form.threshold}%` }}
          onChange={(e) => setForm((f) => ({ ...f, threshold: Number(e.target.value) }))}
        />
      </Field>

      <Field label="Accepted submission formats">
        <div className="tags">
          {settings.formats.map((f) => <span className="tag" key={f}>{f}</span>)}
          <span className="tag">max {settings.maxUploadMb} MB</span>
        </div>
      </Field>

      <Field label="Reference documents (optional)" htmlFor="a-refs" help="Sources to compare submissions against.">
        <input
          className="input" id="a-refs" type="file" multiple accept=".pdf,.docx,.txt"
          onChange={(e) => setForm((f) => ({ ...f, references: Array.from(e.target.files) }))}
        />
      </Field>

      <ErrorMessage error={error} />

      <div className="form-actions">
        {!isPublished && (
          <button className="btn" type="button" disabled={busy} onClick={() => save(false)}>Save draft</button>
        )}
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {isPublished ? "Save changes" : "Publish to course"}
        </button>
      </div>
    </form>
  );
}
