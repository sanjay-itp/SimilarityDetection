import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { ErrorMessage, Loading, PageHeader } from "../../components/ui.jsx";
import { fileSize, formatDate } from "../../utils/format.js";

export default function Receipt() {
  const { submissionId } = useParams();
  const { user } = useAuth();
  const { data: r, loading, error } = useAsync(() => api.getReceipt(user.id, submissionId), [user.id, submissionId]);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const rows = [
    ["Assignment", r.assignment.title],
    ["Course", `${r.assignment.course.code} · ${r.assignment.course.name}`],
    ["Student", `${r.student.name}${r.student.studentId ? ` · ${r.student.studentId}` : ""}`],
    ["Submitted", formatDate(r.submittedAt, { time: true })],
    ["File", `${r.fileName} · ${fileSize(r.fileSize)}`],
    ["Status", r.teacherNote ? "Reviewed by your teacher" : "Waiting for teacher review"],
  ];

  return (
    <>
      <PageHeader
        title="Submission received"
        subtitle="Keep this receipt for your records."
        actions={
          <>
            <button className="btn" type="button" onClick={() => window.print()}>Download receipt</button>
            <Link className="btn btn--primary" to="/student/assignments">Back to assignments</Link>
          </>
        }
      />

      <section className="card receipt" aria-labelledby="receipt-title">
        <h2 className="card__title" id="receipt-title">Receipt {r.receiptId}</h2>
        <dl>
          {rows.map(([k, v]) => (
            <div className="kv" key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {r.teacherNote && (
        <section className="card receipt" aria-labelledby="note-title">
          <h2 className="card__title" id="note-title">Note from your teacher</h2>
          <p>{r.teacherNote}</p>
        </section>
      )}

      <p className="muted">Similarity results are shared with you only after your teacher reviews them.</p>
    </>
  );
}
