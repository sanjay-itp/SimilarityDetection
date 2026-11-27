import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, PageHeader, Tag } from "../../components/ui.jsx";
import { daysUntil, dueAt, formatShort, roman, shortTitle } from "../../utils/format.js";

// Courses come from the administrator's set-up. Students cannot join courses themselves.
export default function StudentCourses() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => api.getStudentHome(user.id), [user.id]);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  const { me, courses } = data;

  return (
    <>
      <PageHeader
        title="My Courses"
        subtitle={`Semester ${roman(me.semester)} · ${courses.length} course${courses.length === 1 ? "" : "s"}`}
      />

      {courses.length === 0 ? (
        <Empty>No courses yet.</Empty>
      ) : (
        <section className="course-grid" aria-label="Courses">
          {courses.map((c) => {
            const soon = c.nextDue && daysUntil(dueAt(c.nextDue)) <= 7;
            return (
              <article className="card course-card" key={c.id}>
                <div className="course-card__top">
                  <Tag strong>{c.code}</Tag>
                  {soon && <Tag>Due soon</Tag>}
                </div>
                <h2 className="course-card__title">{c.name}</h2>
                <p className="course-card__teacher">Taught by {c.teacherName}</p>
                <hr className="divider" />
                <p className="course-card__meta">
                  {c.nextDue
                    ? `${c.assignmentCount} assignment${c.assignmentCount === 1 ? "" : "s"} · Next due: ${shortTitle(c.nextDue.title)} · ${formatShort(dueAt(c.nextDue))}`
                    : "No open assignments"}
                </p>
                <Link to={`/student/assignments?course=${c.id}`}>View assignments</Link>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
