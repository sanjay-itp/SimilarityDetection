import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, PageHeader, Tabs, Tag } from "../../components/ui.jsx";
import { dueAt, formatShort } from "../../utils/format.js";

function statusOf(a) {
  if (a.mySubmission?.teacherNote) return { label: "Teacher note", strong: true };
  if (a.mySubmission) return { label: "Submitted" };
  if (a.isOpen) return { label: "Not submitted" };
  return { label: "Missed" };
}

export default function StudentAssignments() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState("all");
  const { data, loading, error } = useAsync(() => api.getStudentHome(user.id), [user.id]);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const courseId = params.get("course");
  const course = data.courses.find((c) => c.id === courseId);
  const all = data.assignments.filter((a) => !course || a.courseId === course.id);
  const todo = all.filter((a) => a.isOpen && !a.mySubmission);
  const done = all.filter((a) => a.mySubmission);
  const rows = filter === "todo" ? todo : filter === "submitted" ? done : all;

  return (
    <>
      <PageHeader
        title="My Assignments"
        subtitle={course ? `${course.code} · ${course.name}` : `All courses · Semester ${data.me.semester}`}
        actions={course && <button className="btn" type="button" onClick={() => setParams({})}>Show all courses</button>}
      />

      <Tabs
        label="Filter assignments"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "all", label: `All ${all.length}` },
          { value: "todo", label: `To do ${todo.length}` },
          { value: "submitted", label: `Submitted ${done.length}` },
        ]}
      />

      {rows.length === 0 ? (
        <Empty>No assignments here.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Assignment</th>
                <th scope="col">Course</th>
                <th scope="col">Due</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const status = statusOf(a);
                return (
                  <tr key={a.id}>
                    <td>{a.title}</td>
                    <td>{a.course.code}</td>
                    <td>{formatShort(dueAt(a), { time: true })}</td>
                    <td><Tag strong={status.strong}>{status.label}</Tag></td>
                    <td>
                      {a.mySubmission && <Link to={`/student/receipts/${a.mySubmission.id}`}>View receipt</Link>}
                      {!a.mySubmission && a.isOpen && <Link to={`/student/assignments/${a.id}/submit`}>Submit</Link>}
                      {!a.mySubmission && !a.isOpen && <span className="muted">Closed</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
