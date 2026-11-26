import { useState } from "react";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Field, Loading, Notice, PageHeader } from "../../components/ui.jsx";

export default function CoursesTerms() {
  const { data, loading, error, reload } = useAsync(() => api.getCoursesAndTerms(), []);
  const [course, setCourse] = useState({ code: "", name: "", programme: "", semester: "", teacherId: "" });
  const [faculty, setFaculty] = useState({ code: "", name: "", semesters: 8 });
  const [courseError, setCourseError] = useState(null);
  const [facultyError, setFacultyError] = useState(null);
  const [notice, setNotice] = useState("");

  if (loading && !data) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  const { courses, faculties, teachers } = data;
  const selectedProgramme = faculties.find((f) => f.code === (course.programme || faculties[0]?.code));
  const setC = (key) => (e) => setCourse((c) => ({ ...c, [key]: e.target.value }));
  const setF = (key) => (e) => setFaculty((f) => ({ ...f, [key]: e.target.value }));

  async function addCourse(e) {
    e.preventDefault();
    setCourseError(null);
    try {
      const programme = course.programme || faculties[0]?.code;
      const semester = course.semester || selectedProgramme?.current;
      const c = await api.createCourse({ ...course, programme, semester });
      setCourse({ code: "", name: "", programme: "", semester: "", teacherId: "" });
      setNotice(`Added ${c.code} · ${c.name}.`);
      reload();
    } catch (err) {
      setCourseError(err);
    }
  }

  async function addFaculty(e) {
    e.preventDefault();
    setFacultyError(null);
    try {
      const f = await api.createFaculty(faculty);
      setFaculty({ code: "", name: "", semesters: 8 });
      setNotice(`Added ${f.code} · ${f.name}.`);
      reload();
    } catch (err) {
      setFacultyError(err);
    }
  }

  async function nextSemester(f) {
    if (!window.confirm(`Open Semester ${f.current + 1} for ${f.code}? Every ${f.code} student moves forward one semester.`)) return;
    try {
      await api.openNextSemester(f.code);
      setNotice(`${f.code} is now in Semester ${f.current + 1}.`);
      reload();
    } catch (err) {
      setNotice(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Courses & terms" subtitle="Faculties, semesters and courses" />
      <Notice onClose={() => setNotice("")}>{notice}</Notice>

      <div className="layout-side courses-layout">
        <div className="stack">
          <section className="card" aria-labelledby="courses-title">
            <h2 className="card__title" id="courses-title">Courses</h2>
            {courses.length === 0 ? (
              <Empty>No courses yet. Add the first one with the form.</Empty>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Code</th><th scope="col">Course</th><th scope="col">Programme</th>
                      <th scope="col">Teacher</th><th scope="col">Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c) => (
                      <tr key={c.id}>
                        <td>{c.code}</td><td>{c.name}</td><td>{c.programme} · Sem {c.semester}</td>
                        <td>{c.teacherName}</td><td>{c.studentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="faculties-title">
            <h2 className="card__title" id="faculties-title">Faculties &amp; semesters</h2>
            <p className="card__desc">Opening the next semester moves every student in that faculty forward by one semester.</p>
            {faculties.length === 0 && <Empty>No faculties yet. Add one below.</Empty>}
            {faculties.map((f) => (
              <div className="row" key={f.code}>
                <div>
                  <div className="row__title">{f.code} · {f.name}</div>
                  <div className="row__meta">Semesters 1 to {f.semesters} · current: Semester {f.current}</div>
                </div>
                <div className="row__actions">
                  <button className="btn btn--small" type="button" disabled={f.current >= f.semesters} onClick={() => nextSemester(f)}>
                    Open next semester
                  </button>
                </div>
              </div>
            ))}
            <form className="form" onSubmit={addFaculty} noValidate aria-label="New faculty">
              <div className="field-row">
                <Field label="Faculty code" htmlFor="f-code"><input className="input" id="f-code" value={faculty.code} onChange={setF("code")} placeholder="BCA" /></Field>
                <Field label="Semesters" htmlFor="f-sem"><input className="input" id="f-sem" type="number" min="1" max="12" value={faculty.semesters} onChange={setF("semesters")} /></Field>
              </div>
              <Field label="Faculty name" htmlFor="f-name"><input className="input" id="f-name" value={faculty.name} onChange={setF("name")} placeholder="Computer Application" /></Field>
              <ErrorMessage error={facultyError} />
              <div className="form-actions"><button className="btn" type="submit">Add faculty</button></div>
            </form>
          </section>
        </div>

        <form className="card form" onSubmit={addCourse} noValidate aria-labelledby="new-course-title">
          <h2 className="card__title" id="new-course-title">New course</h2>
          {faculties.length === 0 ? (
            <p className="help">Add a faculty first.</p>
          ) : (
            <>
              <div className="field-row">
                <Field label="Code" htmlFor="c-code"><input className="input" id="c-code" value={course.code} onChange={setC("code")} placeholder="ENGL 210" /></Field>
                <Field label="Programme" htmlFor="c-prog">
                  <select className="input" id="c-prog" value={course.programme || faculties[0].code} onChange={setC("programme")}>
                    {faculties.map((f) => <option key={f.code} value={f.code}>{f.code}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Course name" htmlFor="c-name"><input className="input" id="c-name" value={course.name} onChange={setC("name")} placeholder="Academic Writing" /></Field>
              <Field label="Semester" htmlFor="c-sem">
                <select className="input" id="c-sem" value={course.semester || selectedProgramme?.current} onChange={setC("semester")}>
                  {Array.from({ length: selectedProgramme?.semesters ?? 8 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>Semester {n}</option>
                  ))}
                </select>
              </Field>
              <Field label="Teacher" htmlFor="c-teacher">
                <select className="input" id="c-teacher" value={course.teacherId} onChange={setC("teacherId")}>
                  <option value="">Assign later</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
              <ErrorMessage error={courseError} />
              <button className="btn btn--primary btn--block" type="submit">Add course</button>
            </>
          )}
        </form>
      </div>
    </>
  );
}
