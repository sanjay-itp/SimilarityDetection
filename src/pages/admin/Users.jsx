import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, Notice, PageHeader, Tabs, Tag } from "../../components/ui.jsx";
import Credentials from "./Credentials.jsx";
import NewAccountDrawer from "./NewAccountDrawer.jsx";
import TeacherAccountForm from "./TeacherAccountForm.jsx";

const STATUS = { active: "Active", invited: "Invited" };

function facultyCell(u) {
  if (u.role === "student") return `${u.programme} · Sem ${u.semester}`;
  if (u.role === "teacher") return u.faculty || "-";
  return "-";
}

// Reset password and Disable were removed from this list on purpose.
export default function Users() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("teacher");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(params.get("new") === "1");
  const [created, setCreated] = useState([]);
  const [importNote, setImportNote] = useState("");
  const csvInput = useRef(null);
  const { data, loading, error, reload } = useAsync(() => api.listUsers(), []);

  useEffect(() => {
    if (params.get("new") === "1") setParams({}, { replace: true });
  }, [params, setParams]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { users, faculties, courses } = data;
  const count = (role) => users.filter((u) => u.role === role).length;
  const q = query.trim().toLowerCase();
  const rows = users.filter((u) => u.role === tab && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)));

  function onCreated(account) {
    setCreated([account]);
    setDrawerOpen(false);
    reload();
  }

  async function onCsv(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const result = await api.importStudents(await file.text());
    setCreated(result.created);
    setImportNote(
      result.skipped.length
        ? `Skipped ${result.skipped.length} line${result.skipped.length === 1 ? "" : "s"}: ${result.skipped.map((s) => `line ${s.line} (${s.reason})`).join("; ")}`
        : result.created.length ? "" : "No students found in that file."
    );
    setTab("student");
    reload();
  }

  return (
    <>
      <PageHeader
        title="User management"
        subtitle={`${users.length} account${users.length === 1 ? "" : "s"} · all created by administrators`}
        actions={
          <>
            <button className="btn" type="button" onClick={() => csvInput.current?.click()}>Import students .csv</button>
            <input ref={csvInput} className="sr-only" type="file" accept=".csv,text/csv" onChange={onCsv} aria-label="Import students CSV" />
            <button className="btn btn--primary" type="button" onClick={() => setDrawerOpen(true)}>New account</button>
          </>
        }
      />

      <Credentials accounts={created} onClose={() => setCreated([])} />
      <Notice onClose={() => setImportNote("")}>{importNote}</Notice>

      <div className="layout-side users-layout">
        <section className="card" aria-label="Accounts">
          <div className="users-toolbar">
            <Tabs
              label="Account type"
              value={tab}
              onChange={setTab}
              items={[
                { value: "teacher", label: `Teachers ${count("teacher")}` },
                { value: "student", label: `Students ${count("student")}` },
                { value: "admin", label: `Admins ${count("admin")}` },
              ]}
            />
            <input
              className="input search" type="search" placeholder="Search name or email"
              aria-label="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {rows.length === 0 ? (
            <Empty>{q ? "No one matches that search." : "No accounts of this type yet."}</Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">{tab === "student" ? "Programme" : "Faculty"}</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{facultyCell(u)}</td>
                      <td><Tag strong={u.status === "invited"}>{STATUS[u.status] ?? u.status}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "student" && (
            <p className="help">
              CSV import columns: <code>name, email, student_id, programme, semester</code>. A header row is optional.
            </p>
          )}
        </section>

        <TeacherAccountForm faculties={faculties} courses={courses} onCreated={(a) => { setCreated([a]); reload(); }} />
      </div>

      <NewAccountDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} faculties={faculties} onCreated={onCreated} />
    </>
  );
}
