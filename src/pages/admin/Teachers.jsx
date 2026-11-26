import { useState } from "react";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, PageHeader, Tabs, Tag } from "../../components/ui.jsx";
import AccountModal from "./AccountModal.jsx";
import { useNewParam } from "./useNewParam.js";

const STATUS = { active: "Active", invited: "Invited" };

// Teacher list only. Students have their own page. No reset or disable actions.
export default function Teachers() {
  const [open, setOpen] = useNewParam();
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState("all");
  const { data, loading, error, reload } = useAsync(() => api.listUsers(), []);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { faculties, courses } = data;
  const teachers = data.users.filter((u) => u.role === "teacher");
  const q = query.trim().toLowerCase();
  const rows = teachers.filter(
    (t) => (faculty === "all" || t.faculty === faculty) && (!q || `${t.name} ${t.email}`.toLowerCase().includes(q))
  );

  return (
    <>
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teacher account${teachers.length === 1 ? "" : "s"} · created by administrators`}
        actions={<button className="btn btn--primary" type="button" onClick={() => setOpen(true)}>Add teacher</button>}
      />

      <section className="card" aria-label="Teacher accounts">
        <div className="list-toolbar">
          {faculties.length > 1 ? (
            <Tabs
              label="Faculty"
              value={faculty}
              onChange={setFaculty}
              items={[
                { value: "all", label: `All ${teachers.length}` },
                ...faculties.map((f) => ({ value: f.code, label: `${f.code} ${teachers.filter((t) => t.faculty === f.code).length}` })),
              ]}
            />
          ) : (
            <span />
          )}
          <input className="input search" type="search" placeholder="Search name or email"
            aria-label="Search teachers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {rows.length === 0 ? (
          <Empty>{q || faculty !== "all" ? "No teachers match." : "No teachers yet. Add the first one."}</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Faculty</th>
                  <th scope="col">Courses</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.email}</td>
                    <td>{t.faculty || "-"}</td>
                    <td>{t.courses.length ? t.courses.join(", ") : "None yet"}</td>
                    <td><Tag strong={t.status === "invited"}>{STATUS[t.status] ?? t.status}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AccountModal role="teacher" open={open} onClose={() => setOpen(false)} faculties={faculties} courses={courses} onCreated={reload} />
    </>
  );
}
