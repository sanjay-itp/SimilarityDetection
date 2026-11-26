import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, PageHeader, Tag } from "../../components/ui.jsx";
import { download, dueAt, formatDate, formatShort, shortTitle, toCsv } from "../../utils/format.js";

export default function Submissions() {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => api.getAssignmentSubmissions(user.id, assignmentId), [user.id, assignmentId]);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { assignment: a, rows, studentCount, missing, pairs } = data;
  const flagged = pairs.filter((p) => p.status === "pending");

  function exportList() {
    const csv = toCsv([
      ["Student", "Submitted", "File", "Highest match", "Status", "Receipt"],
      ...rows.map((r) => [r.studentName, formatDate(r.submittedAt, { time: true }), r.fileName, r.highestMatch == null ? "" : `${r.highestMatch}%`, r.status, r.receiptId]),
      ...missing.map((name) => [name, "", "", "", "Not submitted", ""]),
    ]);
    download(`${a.course.code} ${shortTitle(a.title)} submissions.csv`, csv);
  }

  return (
    <>
      <PageHeader
        title={`${shortTitle(a.title)} · Submissions`}
        subtitle={`${a.course.code} · Due ${formatDate(dueAt(a), { time: true })} · ${rows.length} of ${studentCount} submitted`}
        actions={<button className="btn" type="button" onClick={exportList}>Export list</button>}
      />

      {rows.length === 0 ? (
        <Empty>No submissions yet.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Submitted</th>
                <th scope="col">File</th>
                <th scope="col">Highest match</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.studentName}</td>
                  <td>{formatShort(r.submittedAt, { time: true })}</td>
                  <td>{r.fileName}</td>
                  <td>{r.highestMatch == null ? "-" : `${r.highestMatch}%`}</td>
                  <td><Tag strong={r.status === "Pending" || r.status === "Concern"}>{r.status}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {missing.length > 0 && <p className="muted">Not submitted yet: {missing.join(", ")}.</p>}

      <section className="card" aria-labelledby="pairs-title">
        <h2 className="card__title" id="pairs-title">Flagged pairs</h2>
        <p className="card__desc">Comparisons run on your institution’s server. Nothing is sent to third parties.</p>
        {flagged.length === 0 && <Empty>No pairs waiting for review.</Empty>}
        {flagged.map((p) => (
          <div className="row" key={p.id}>
            <div>
              <div className="row__title">{p.aView.name} and {p.bView.name}</div>
              <div className="row__meta">
                {p.score}% similarity{p.passages?.length ? ` · ${p.passages.length} matching passage${p.passages.length === 1 ? "" : "s"}` : ""}
              </div>
            </div>
            <div className="row__actions">
              <Link className="btn btn--small" to={`/teacher/pairs/${p.id}`}>Open report</Link>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
