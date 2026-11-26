import { Link } from "react-router-dom";
import { Tag } from "../../components/ui.jsx";
import { shortTitle } from "../../utils/format.js";

/** One flagged pair: "Daniel Okafor and Mei Lin · 72% similarity · Review". */
export default function PairRow({ pair, action = "Review" }) {
  const a = pair.assignment;
  return (
    <div className="row">
      <div>
        <div className="row__title">{pair.aView.name} and {pair.bView.name}</div>
        <div className="row__meta">{shortTitle(a?.title)} · {a?.course?.code}</div>
      </div>
      <div className="row__actions">
        <Tag strong={pair.score >= 60}>{pair.score}% similarity</Tag>
        <Link className="btn btn--small" to={`/teacher/pairs/${pair.id}`}>{action}</Link>
      </div>
    </div>
  );
}
