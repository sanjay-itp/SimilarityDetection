import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { MultiFileUpload } from "../../components/FileUpload.jsx";
import { ErrorMessage, Loading, PageHeader } from "../../components/ui.jsx";
import { dueAt, fileSize, formatDate } from "../../utils/format.js";

/** Files the student handed in. Older submissions hold a single fileName/fileSize. */
function submittedFiles(s) {
  if (!s) return [];
  return s.files?.length ? s.files : [{ name: s.fileName, size: s.fileSize }];
}

/**
 * Submit page (/student/assignments/:id/submit) and the read-only view
 * (/student/assignments/:id, opened by "View only"). After submitting or
 * cancelling, the student goes straight back to My Assignments.
 */
export default function SubmitAssignment({ readOnly = false }) {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const { data: a, loading, error } = useAsync(() => api.getAssignmentForStudent(user.id, assignmentId), [user.id, assignmentId]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { formats, maxUploadMb } = a.settings;
  const handedIn = submittedFiles(a.mySubmission);
  const canUpload = !readOnly && a.isOpen;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setSubmitError(null);
    try {
      await api.submitAssignment({
        studentId: user.id,
        assignmentId,
        files: files.map((f) => ({ name: f.name, size: f.size })),
      });
      navigate("/student/assignments", { replace: true });
    } catch (err) {
      setSubmitError(err);
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={readOnly ? "View submission" : "Submit assignment"}
        subtitle={`${a.title} · ${a.course.code} · Due ${formatDate(dueAt(a), { time: true })}`}
        actions={<Link className="btn" to="/student/assignments">{readOnly ? "Back to assignments" : "Cancel"}</Link>}
      />

      <form className="card submit-card" onSubmit={onSubmit} noValidate>
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

        {handedIn.length > 0 && (
          <>
            <p className="help">Submitted {formatDate(a.mySubmission.submittedAt, { time: true })}</p>
            {handedIn.map((f) => (
              <div className="row" key={f.name}>
                <div>
                  <div className="row__title">{f.name}</div>
                  <div className="row__meta">{fileSize(f.size)}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {!canUpload && handedIn.length === 0 && <p className="muted">Nothing submitted.</p>}
        {!readOnly && !a.isOpen && <p className="muted">This assignment is closed. Submissions are no longer accepted.</p>}

        {canUpload && (
          <>
            {handedIn.length > 0 && <p className="help">Uploading again replaces the files above.</p>}
            <MultiFileUpload
              accept={formats.join(",")}
              maxTotalMb={maxUploadMb}
              title="Drop your files here, or browse"
              hint={`${formats.join(", ")} · up to ${maxUploadMb} MB in total`}
              files={files}
              onFiles={setFiles}
            />
            <ErrorMessage error={submitError} />
            <div className="form-actions">
              <button className="btn btn--primary" type="submit" disabled={!files.length || busy}>
                {busy ? "Submitting…" : "Submit"}
              </button>
            </div>
          </>
        )}
      </form>
    </>
  );
}
