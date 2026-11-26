import { Outlet } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import "../styles/student.css";

const NAV = [
  { to: "/student", label: "Dashboard", end: true },
  { to: "/student/courses", label: "My Courses" },
  { to: "/student/assignments", label: "My Assignments" },
  { label: "Notifications", disabled: true },
  { label: "Profile", disabled: true },
];

export default function StudentLayout() {
  return (
    <AppShell role="student" roleLabel="Student workspace" nav={NAV}>
      <Outlet />
    </AppShell>
  );
}
