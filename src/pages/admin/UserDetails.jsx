import Modal from "../../components/Modal.jsx";
import { formatDate, roman } from "../../utils/format.js";

const STATUS = { active: "Active", invited: "Invited, not signed in yet" };

/** Read-only popup with one teacher's or student's account details. */
export default function UserDetails({ user, courses = [], faculties = [], onClose }) {
  if (!user) return null;
  const isStudent = user.role === "student";
  const facultyName = (code) => faculties.find((f) => f.code === code)?.name;
  const theirCourses = isStudent
    ? courses.filter((c) => c.programme === user.programme && Number(c.semester) === Number(user.semester))
    : courses.filter((c) => c.teacherId === user.id);

  const rows = [
    ["Name", user.name],
    ["Email", user.email],
    ...(isStudent
      ? [
          ["Student ID", user.studentId || "-"],
          ["Programme", user.programme ? `${user.programme}${facultyName(user.programme) ? ` · ${facultyName(user.programme)}` : ""}` : "-"],
          ["Semester", roman(user.semester)],
        ]
      : [["Faculty", user.faculty ? `${user.faculty}${facultyName(user.faculty) ? ` · ${facultyName(user.faculty)}` : ""}` : "-"]]),
    ["Status", STATUS[user.status] ?? user.status],
    ["Account created", formatDate(user.createdAt, { time: true })],
    [isStudent ? "Courses" : "Teaches", theirCourses.length ? theirCourses.map((c) => `${c.code} · ${c.name}`).join(", ") : "None yet"],
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={user.name}
      subtitle={isStudent ? "Student account" : "Teacher account"}
      onSubmit={(e) => e.preventDefault()}
      footer={<button className="btn btn--primary" type="button" onClick={onClose}>Close</button>}
    >
      <dl className="summary">
        {rows.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
    </Modal>
  );
}
