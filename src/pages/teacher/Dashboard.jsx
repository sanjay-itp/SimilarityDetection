import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, Notice, PageHeader, StatCard } from "../../components/ui.jsx";
import PairRow from "./PairRow.jsx";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [notice, setNotice] = useState("");
  const [running, setRunning] = useState(false);
  const { data, loading, error, reload } = useAsync(() => api.getTeacherHome(user.id), [user.id]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  async function runComparison() {
    setRunning(true);
    const { checked } = await api.runComparison(user.id);
    setNotice(checked ? `Compared ${checked} new submission${checked === 1 ? "" : "s"}.` : "Every submission has already been compared.");
    setRunning(false);
    reload();
  }

  const codes = data.courses.map((c) => c.code);
  const firstCourse = data.courses[0];

  return (
    <>
      <PageHeader
        title="Teacher dashboard"
        subtitle={`${data.courses.length} course${data.courses.length === 1 ? "" : "s"}${codes.length ? ` · ${codes.join(", ")}` : ""}`}
        actions={
          <>
            <button className="btn" type="button" onClick={runComparison} disabled={running}>
              {running ? "Comparing…" : "Run comparison"}
            </button>
            {firstCourse && (
              <Link className="btn btn--primary" to={`/teacher/courses/${firstCourse.id}`}>New assignment</Link>
            )}
          </>
        }
      />

      <Notice onClose={() => setNotice("")}>{notice}</Notice>

      <section className="stats" aria-label="Summary">
        <StatCard label="Active assignments" value={data.activeAssignments} sub={codes.length ? `Across ${codes.join(" & ")}` : "No courses yet"} />
        <StatCard label="Submissions" value={data.submissionCount} sub={`${data.newSubmissions} new since yesterday`} />
        <StatCard label="Awaiting review" value={data.pending.length} sub="Flagged above threshold" />
        <StatCard label="Confirmed concerns" value={data.concerns} sub="This semester" />
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
