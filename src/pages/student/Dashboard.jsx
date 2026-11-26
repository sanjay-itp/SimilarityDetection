import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, PageHeader, StatCard, Tag } from "../../components/ui.jsx";
import { dueAt, dueLabel, firstName, formatShort, greeting, relative, shortTitle } from "../../utils/format.js";

function recentActivity(submissions) {
  const items = [];
  for (const s of submissions) {
    const title = shortTitle(s.assignment?.title);
    items.push({ key: `${s.id}-r`, title: `Receipt ${s.receiptId} issued`, meta: `${title} · ${relative(s.submittedAt)}`, at: s.submittedAt });
    if (s.teacherNote) items.push({ key: `${s.id}-n`, title: "Teacher note released", meta: title, at: s.submittedAt });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => api.getStudentHome(user.id), [user.id]);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { me, courses, assignments, submissions } = data;
  const todo = assignments.filter((a) => a.isOpen && !a.mySubmission);
  const weekEnd = Date.now() + 7 * 86400000;
  const dueThisWeek = todo.filter((a) => dueAt(a).getTime() <= weekEnd);
  const notes = submissions.filter((s) => s.teacherNote);
  const activity = recentActivity(submissions);

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName(me.name)}`}
        subtitle={`${me.programme} · Semester ${me.semester}`}
        actions={<Link className="btn btn--primary" to="/student/assignments">Submit an assignment</Link>}
      />

      <section className="stats" aria-label="Summary">
        <StatCard label="Enrolled courses" value={courses.length} sub={`Semester ${me.semester}`} />
        <StatCard
          label="Due this week"
          value={dueThisWeek.length}
          sub={dueThisWeek[0] ? `Next: ${shortTitle(dueThisWeek[0].title)} · ${formatShort(dueAt(dueThisWeek[0]), { time: true })}` : "Nothing due"}
        />
        <StatCard label="Submitted" value={submissions.length} sub="Across all courses" />
        <StatCard label="Teacher notes" value={notes.length} sub={notes[0] ? `Latest on ${shortTitle(notes[0].assignment?.title)}` : "No notes yet"} />
      </section>

      <div className="layout-side">
        <section className="card" aria-labelledby="due-title">
          <div className="card__head">
            <h2 className="card__title" id="due-title">Due soon</h2>
            <Link to="/student/assignments">View all</Link>
          </div>
          {todo.length === 0 && <Empty>Nothing due right now.</Empty>}
          {todo.slice(0, 3).map((a) => (
            <div className="row" key={a.id}>
              <div>
                <div className="row__title">{a.title}</div>
                <div className="row__meta">{a.course.code} · {a.course.name}</div>
              </div>
              <div className="row__actions">
                <Tag>{dueLabel(a)}</Tag>
                <Link className="btn btn--small" to={`/student/assignments/${a.id}/submit`}>Submit</Link>
              </div>
            </div>
          ))}
        </section>

        <section className="card" aria-labelledby="activity-title">
          <h2 className="card__title" id="activity-title">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="muted">No activity yet.</p>
          ) : (
            <ul className="plain activity">
              {activity.map((item) => (
                <li key={item.key}>
                  <div className="activity__title">{item.title}</div>
                  <div className="activity__meta">{item.meta}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="note">
            <strong>Privacy</strong>
            Your work is compared only within this institution. Scores are reviewed by your teacher before any decision.
          </div>
        </section>
      </div>
    </>
  );
}
