import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, PageHeader } from "../../components/ui.jsx";
import { dueAt, formatShort } from "../../utils/format.js";
import PairRow from "./PairRow.jsx";

export default function ReviewQueue() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => api.getTeacherHome(user.id), [user.id]);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <>
      <PageHeader title="Review queue" subtitle={`${data.pending.length} flagged pair${data.pending.length === 1 ? "" : "s"} across your courses`} />

      <section className="card" aria-labelledby="pending-title">
        <h2 className="card__title" id="pending-title">Flagged pairs</h2>
        {data.pending.length === 0 && <Empty>Nothing to review right now.</Empty>}
        {data.pending.map((p) => <PairRow key={p.id} pair={p} />)}
      </section>

      <section className="card" aria-labelledby="by-assignment-title">
        <h2 className="card__title" id="by-assignment-title">Submissions by assignment</h2>
        {data.assignments.length === 0 && <Empty>No published assignments yet.</Empty>}
        {data.assignments.map((a) => (
          <div className="row" key={a.id}>
            <div>
              <div className="row__title">{a.title}</div>
              <div className="row__meta">
                {a.course.code} · {a.isOpen ? `Due ${formatShort(dueAt(a))}` : "Closed"} · {a.submitted} submission{a.submitted === 1 ? "" : "s"}
              </div>
            </div>
            <div className="row__actions">
              <Link className="btn btn--small" to={`/teacher/assignments/${a.id}`}>Open</Link>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
