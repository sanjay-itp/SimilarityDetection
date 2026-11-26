import { Link } from "react-router-dom";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { DEMO_PASSWORD } from "../../services/mockData.js";
import { Empty, ErrorMessage, Loading, PageHeader, StatCard } from "../../components/ui.jsx";
import { download, relative, toCsv } from "../../utils/format.js";

const CHART_HEIGHT = 200;

export default function AdminDashboard() {
  const { data, loading, error } = useAsync(() => api.getAdminHome(), []);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { institution, users, flagRate } = data;
  const maxRate = Math.max(1, ...flagRate.map((c) => c.rate));
  const topRate = Math.max(...flagRate.map((c) => c.rate), 0);

  function exportReport() {
    download(
      "Origyn semester report.csv",
      toCsv([["Course", "Submissions", "Flag rate"], ...flagRate.map((c) => [c.code, c.total, `${c.rate}%`])])
    );
  }

  return (
    <>
      <PageHeader
        title="System overview"
        subtitle={`${institution?.name ?? "Origyn"}${institution?.department ? ` · ${institution.department}` : ""}`}
        actions={
          <>
            <button className="btn" type="button" onClick={exportReport}>Export semester report</button>
            <Link className="btn" to="/admin/teachers?new=1">Add teacher</Link>
            <Link className="btn btn--primary" to="/admin/students?new=1">Add student</Link>
          </>
        }
      />

      {institution?.demo && (
        <div className="note">
          <strong>Demo data is loaded</strong>
          <p>
            Demo teachers and students sign in with the password <code>{DEMO_PASSWORD}</code>, for example
            c.thapa@ics.dev (teacher) or priya@student.ics.dev (student). Clear it under System settings before real use.
          </p>
        </div>
      )}

      <section className="stats" aria-label="Summary">
        <StatCard label="Total users" value={users.total} sub={`${users.students} students · ${users.teachers} teachers · ${users.admins} admin${users.admins === 1 ? "" : "s"}`} />
        <StatCard label="Flagged for review" value={data.pending} sub={`${data.flaggedShare.toFixed(1)}% of submissions`} />
        <StatCard label="Confirmed concerns" value={data.concerns} sub={`${data.dismissed} dismissed`} />
      </section>

      <div className="layout-side">
        <section className="card" aria-labelledby="chart-title">
          <h2 className="card__title" id="chart-title">Flag rate by course</h2>
          <p className="card__desc">Share of submissions flagged above threshold, per course.</p>
          {flagRate.length === 0 ? (
            <Empty>No courses yet. Add them under Courses &amp; terms.</Empty>
          ) : (
            <div className="chart" role="img" aria-label={`Flag rate: ${flagRate.map((c) => `${c.code} ${c.rate}%`).join(", ")}`}>
              {flagRate.map((c) => (
                <div className={`bar${c.rate === topRate && topRate > 0 ? " bar--highlight" : ""}`} key={c.code}>
                  <span className="bar__value">{c.rate}%</span>
                  <span className="bar__fill" style={{ "--value": Math.round((c.rate / maxRate) * CHART_HEIGHT) }} />
                  <span className="bar__label">{c.code}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="activity-title">
          <h2 className="card__title" id="activity-title">Recent activity</h2>
          <ul className="plain activity">
            {data.activity.map((a) => (
              <li key={a.id}>
                <div className="activity__title">{a.title}</div>
                <div className="activity__meta">{a.meta} · {relative(a.at)}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
