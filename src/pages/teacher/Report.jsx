import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { ErrorMessage, Field, Loading, PageHeader, Tag } from "../../components/ui.jsx";
import { formatDate, shortTitle } from "../../utils/format.js";

/** Wraps every matching passage in <mark>, case-insensitive. */
function highlight(text, passages = []) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const ranges = passages
    .map((p) => {
      const i = lower.indexOf(p.toLowerCase());
      return i >= 0 ? [i, i + p.length] : null;
    })
    .filter(Boolean)
    .sort((x, y) => x[0] - y[0]);
  const out = [];
  let pos = 0;
  ranges.forEach(([start, end], k) => {
    if (start < pos) return;
    out.push(text.slice(pos, start));
    out.push(<mark key={k}>{text.slice(start, end)}</mark>);
    pos = end;
  });
  out.push(text.slice(pos));
  return out;
}

export default function Report() {
  const { pairId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const { data: p, loading, error } = useAsync(() => api.getPair(user.id, pairId), [user.id, pairId]);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const a = p.assignment;
  const backTo = `/teacher/assignments/${a.id}`;

  async function decide(decision) {
    setBusy(true);
    setSaveError(null);
    try {
      await api.decidePair(user.id, p.id, decision, note);
      navigate(backTo);
    } catch (err) {
      setSaveError(err);
      setBusy(false);
    }
  }

  const hasText = Boolean(p.textA || p.textB);

  return (
    <>
      <PageHeader
        title={`${p.aView.name} and ${p.bView.name}`}
        subtitle={`${shortTitle(a.title)} · ${a.course.code} · Threshold ${a.threshold}%`}
        actions={<Link className="btn" to={backTo}>Back to submissions</Link>}
      />

      <div className="layout-side report-layout">
        <section className="card" aria-label="Comparison">
          <div className="score">
            <span className="score__value">{p.score}% similarity</span>
            {p.passages?.length > 0 && (
              <span className="muted">
                {p.passages.length} matching passage{p.passages.length === 1 ? "" : "s"} · matches shown in blue
              </span>
            )}
          </div>
          {hasText ? (
            <div className="compare">
              <article className="doc">
                <h2 className="doc__name">{p.aView.name}{p.aView.fileName ? ` · ${p.aView.fileName}` : ""}</h2>
                <p className="doc__text">{highlight(p.textA, p.passages)}</p>
              </article>
              <article className="doc">
                <h2 className="doc__name">{p.bView.name}{p.bView.fileName ? ` · ${p.bView.fileName}` : ""}</h2>
                <p className="doc__text">{highlight(p.textB, p.passages)}</p>
              </article>
            </div>
          ) : (
            <p className="muted">The side-by-side text appears once the Origyn server returns the matched passages.</p>
          )}
        </section>

        <section className="card form" aria-labelledby="decision-title">
          <h2 className="card__title" id="decision-title">Your decision</h2>
          {p.status === "pending" ? (
            <>
              <p className="card__desc">The tool only flags. Decide after reading both documents.</p>
              <Field label="Note to students (optional)" htmlFor="note">
                <textarea className="input" id="note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain your decision…" />
              </Field>
              <ErrorMessage error={saveError} />
              <button className="btn btn--primary btn--block" type="button" disabled={busy} onClick={() => decide("concern")}>Confirm concern</button>
              <button className="btn btn--block" type="button" disabled={busy} onClick={() => decide("dismiss")}>Dismiss flag</button>
            </>
          ) : (
            <>
              <Tag strong>{p.status === "concern" ? "Concern confirmed" : "Flag dismissed"}</Tag>
              {p.decidedAt && <p className="muted">Decided {formatDate(p.decidedAt, { time: true })}</p>}
              {p.note && <p>{p.note}</p>}
            </>
          )}
        </section>
      </div>
    </>
  );
}
