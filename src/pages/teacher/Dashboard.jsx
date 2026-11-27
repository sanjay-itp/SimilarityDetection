import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, PageHeader, StatCard } from "../../components/ui.jsx";
import { greeting } from "../../utils/format.js";
import PairRow from "./PairRow.jsx";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => api.getTeacherHome(user.id), [user.id]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const firstCourse = data.courses[0];

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.name}`}
        actions={
          firstCourse && <Link className="btn btn--primary" to={`/teacher/courses/${firstCourse.id}`}>New assignment</Link>
        }
      />

      <section className="stats" aria-label="Summary">
        <StatCard label="Active assignments" value={data.activeAssignments} />
        <StatCard label="Submissions" value={data.submissionCount} sub={`${data.newSubmissions} new since yesterday`} />
        <StatCard label="Awaiting review" value={data.pending.length} sub="Flagged above threshold" />
      </section>

      <section className="card" aria-labelledby="flagged-title">
        <div className="card__head">
          <h2 className="card__title" id="flagged-title">Flagged pairs awaiting your review</h2>
          <Link to="/teacher/review">Open review queue</Link>
        </div>
        <p className="card__desc">Scores at or above the assignment threshold are flagged as Pending. The tool only flags; you decide.</p>
        {data.pending.length === 0 && <Empty>Nothing to review right now.</Empty>}
        {data.pending.slice(0, 5).map((p) => <PairRow key={p.id} pair={p} />)}
      </section>
    </>
  );
}
