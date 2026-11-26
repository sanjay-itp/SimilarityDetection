import { useRef, useState } from "react";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, Notice, PageHeader, Tabs, Tag } from "../../components/ui.jsx";
import AccountModal from "./AccountModal.jsx";
import Credentials from "./Credentials.jsx";
import { useNewParam } from "./useNewParam.js";

const STATUS = { active: "Active", invited: "Invited" };

// Student list only. Teachers have their own page. No reset or disable actions.
export default function Students() {
  const [open, setOpen] = useNewParam();
  const [query, setQuery] = useState("");
  const [programme, setProgramme] = useState("all");
  const [imported, setImported] = useState([]);
  const [importNote, setImportNote] = useState("");
  const csvInput = useRef(null);
  const { data, loading, error, reload } = useAsync(() => api.listUsers(), []);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { faculties } = data;
  const students = data.users.filter((u) => u.role === "student");
  const q = query.trim().toLowerCase();
  const rows = students.filter(
    (s) =>
      (programme === "all" || s.programme === programme) &&
      (!q || `${s.name} ${s.email} ${s.studentId ?? ""}`.toLowerCase().includes(q))
  );

  async function onCsv(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const result = await api.importStudents(await file.text());
    setImported(result.created);
    setImportNote(
      result.skipped.length
        ? `Skipped ${result.skipped.length} line${result.skipped.length === 1 ? "" : "s"}: ${result.skipped.map((s) => `line ${s.line} (${s.reason})`).join("; ")}`
        : result.created.length ? "" : "No students found in that file."
    );
    reload();
  }

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${students.length} student account${students.length === 1 ? "" : "s"} · created by administrators`}
        actions={
          <>
            <button className="btn" type="button" onClick={() => csvInput.current?.click()}>Import students .csv</button>
            <input ref={csvInput} className="sr-only" type="file" accept=".csv,text/csv" onChange={onCsv} aria-label="Import students CSV" />
            <button className="btn btn--primary" type="button" onClick={() => setOpen(true)}>Add student</button>
          </>
        }
      />

      <Credentials accounts={imported} onClose={() => setImported([])} />
      <Notice onClose={() => setImportNote("")}>{importNote}</Notice>

      <section className="card" aria-label="Student accounts">
        <div className="list-toolbar">
          {faculties.length > 1 ? (
            <Tabs
              label="Programme"
              value={programme}
              onChange={setProgramme}
              items={[
                { value: "all", label: `All ${students.length}` },
                ...faculties.map((f) => ({ value: f.code, label: `${f.code} ${students.filter((s) => s.programme === f.code).length}` })),
              ]}
            />
          ) : (
            <span />
          )}
          <input className="input search" type="search" placeholder="Search name, email or ID"
            aria-label="Search students" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {rows.length === 0 ? (
          <Empty>{q || programme !== "all" ? "No students match." : "No students yet. Add one or import a CSV file."}</Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Student ID</th>
                  <th scope="col">Email</th>
                  <th scope="col">Programme</th>
                  <th scope="col">Semester</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.studentId || "-"}</td>
                    <td>{s.email}</td>
                    <td>{s.programme}</td>
                    <td>{s.semester}</td>
                    <td><Tag strong={s.status === "invited"}>{STATUS[s.status] ?? s.status}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="help">
          CSV import columns: <code>name, email, student_id, programme, semester</code>. A header row is optional.
        </p>
      </section>

      <AccountModal role="student" open={open} onClose={() => setOpen(false)} faculties={faculties} onCreated={reload} />
    </>
  );
}
