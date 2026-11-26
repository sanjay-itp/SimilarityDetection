import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, Notice, PageHeader, Tabs, Tag } from "../../components/ui.jsx";
import { dueAt, formatDate, formatShort } from "../../utils/format.js";
import AssignmentForm from "./AssignmentForm.jsx";

function statusLabel(a) {
  if (a.status === "draft") return "Draft";
  return a.isOpen ? "Open" : "Closed";
}

export default function TeacherCourse() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);
  const [showRoster, setShowRoster] = useState(false);
  const [notice, setNotice] = useState("");
  const { data, loading, error, reload } = useAsync(() => api.getTeacherCourse(user.id, courseId), [user.id, courseId]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { course, courses, students, assignments, settings } = data;

  async function remove(a) {
    if (!window.confirm(`Delete "${a.title}"? Its submissions and reports are deleted too.`)) return;
    await api.deleteAssignment(user.id, a.id);
    if (editing?.id === a.id) setEditing(null);
    setNotice(`Deleted ${a.title}.`);
    reload();
  }

  function focusForm() {
    setEditing(null);
    document.getElementById("assignment-form")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("a-title")?.focus();
  }

  return (
    <>
      <PageHeader
        title={`${course.code} · ${course.name}`}
        subtitle={`${course.programme} · Semester ${course.semester} · ${students.length} student${students.length === 1 ? "" : "s"}`}
        actions={
          <>
            <button className="btn" type="button" onClick={() => setShowRoster((s) => !s)}>
              {showRoster ? "Hide roster" : "View roster"}
            </button>
            <button className="btn btn--primary" type="button" onClick={focusForm}>New assignment</button>
          </>
        }
      />

      {courses.length > 1 && (
        <Tabs
          label="Your courses"
          value={course.id}
          onChange={(id) => navigate(`/teacher/courses/${id}`)}
          items={courses.map((c) => ({ value: c.id, label: c.code }))}
        />
      )}

      <Notice onClose={() => setNotice("")}>{notice}</Notice>

      {showRoster && (
        <section className="card" aria-labelledby="roster-title">
          <h2 className="card__title" id="roster-title">Roster</h2>
          {students.length === 0 ? (
            <p className="muted">No students in {course.programme} Semester {course.semester} yet.</p>
          ) : (
            <div className="roster">{students.map((s) => <Tag key={s.id}>{s.name}</Tag>)}</div>
          )}
        </section>
      )}

      <div className="layout-side course-layout">
        <section className="card" aria-labelledby="assignments-title">
          <h2 className="card__title" id="assignments-title">Assignments in this course</h2>
          {assignments.length === 0 && <Empty>No assignments yet. Create one with the form.</Empty>}
          {assignments.map((a) => (
            <article className={`assignment${editing?.id === a.id ? " assignment--editing" : ""}`} key={a.id}>
              <div className="assignment__top">
                <h3 className="assignment__title">{a.title}</h3>
                <Tag strong={statusLabel(a) === "Open"}>{statusLabel(a)}</Tag>
              </div>
              <p className="assignment__meta">
                {a.status === "draft" ? "Draft, not published" : a.isOpen ? `Due ${formatDate(dueAt(a), { time: true })}` : `Closed ${formatShort(dueAt(a))}`}
                {` · Threshold ${a.threshold}%`}
                {a.status !== "draft" && ` · ${a.submitted} / ${students.length} submitted`}
                {a.file && ` · ${a.file.name}`}
              </p>
              <div className="assignment__actions">
                <Link className="btn btn--small" to={`/teacher/assignments/${a.id}`}>Review submissions</Link>
                <button className="btn btn--small" type="button" onClick={() => setEditing(a)}>Edit</button>
                <button className="btn btn--small" type="button" onClick={() => remove(a)}>Delete</button>
              </div>
            </article>
          ))}
        </section>

        <AssignmentForm
          teacherId={user.id}
          courseId={course.id}
          settings={settings}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          onSaved={(saved, publish) => {
            setEditing(null);
            setNotice(publish ? `Published "${saved.title}" to ${course.code}.` : `Saved "${saved.title}".`);
            reload();
          }}
        />
      </div>
    </>
  );
}
