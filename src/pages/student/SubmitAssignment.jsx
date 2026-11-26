import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import FileUpload from "../../components/FileUpload.jsx";
import { ErrorMessage, Loading, PageHeader } from "../../components/ui.jsx";
import { dueAt, fileSize, formatDate } from "../../utils/format.js";

export default function SubmitAssignment() {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [declared, setDeclared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const { data: a, loading, error } = useAsync(() => api.getAssignmentForStudent(user.id, assignmentId), [user.id, assignmentId]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { formats, maxUploadMb } = a.settings;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setSubmitError(null);
    try {
      const sub = await api.submitAssignment({ studentId: user.id, assignmentId, file: { name: file.name, size: file.size } });
      navigate(`/student/receipts/${sub.id}`, { replace: true });
    } catch (err) {
      setSubmitError(err);
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Submit assignment"
        subtitle={`${a.title} · ${a.course.code} · Due ${formatDate(dueAt(a), { time: true })}`}
        actions={<Link className="btn" to="/student/assignments">Cancel</Link>}
      />

      <div className="layout-side submit-layout">
        <form className="card" onSubmit={onSubmit} noValidate>
          <h2 className="card__title">Assignment brief</h2>
          <p className="brief">{a.instructions || "No written instructions. See the attached file."}</p>
          {a.file && (
            <div className="row">
              <div>
                <div className="row__title">{a.file.name}</div>
                <div className="row__meta">Attached by {a.course.teacherName} · {fileSize(a.file.size)}</div>
              </div>
              <div className="row__actions">
                {/* File download needs the backend's file storage. */}
                <button className="btn btn--small" type="button" disabled title="Available once the Origyn server stores files">
                  Download
                </button>
              </div>
            </div>
          )}

          <hr className="divider" />
          <h2 className="card__title">Your submission</h2>

          {!a.isOpen ? (
            <p className="muted">This assignment is closed. Submissions are no longer accepted.</p>
          ) : (
            <>
              {a.mySubmission && (
                <p className="help">
                  You already submitted {a.mySubmission.fileName}. Uploading again replaces it and issues a new receipt.
                </p>
              )}
              <FileUpload
                accept={formats.join(",")}
                maxMb={maxUploadMb}
                title="Drop your file here, or browse"
                hint={`${formats.join(", ")} · max ${maxUploadMb} MB`}
                file={file}
                onFile={setFile}
                fileNote="ready to submit"
              />
              <label className="check">
                <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
                I confirm this is my own work and I have cited every source.
              </label>
              <ErrorMessage error={submitError} />
              <div className="form-actions">
                <button className="btn btn--primary" type="submit" disabled={!file || !declared || busy}>
                  {busy ? "Submitting…" : "Submit"}
                </button>
              </div>
            </>
          )}
        </form>

        <aside className="card" aria-labelledby="tips-title">
          <h2 className="card__title" id="tips-title">Before you submit</h2>
          <ul className="tips">
            <li>One file per submission. Uploading again replaces it until the deadline.</li>
            <li>Your file is compared with classmates’ work and past submissions in this institution only.</li>
            <li>You get a receipt with a unique ID the moment it is received.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
