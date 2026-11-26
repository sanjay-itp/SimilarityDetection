import { Outlet } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import "../styles/teacher.css";

const NAV = [
  { to: "/teacher", label: "Dashboard", end: true },
  { to: "/teacher/courses", label: "My Courses" },
  { to: "/teacher/review", label: "Review queue" },
  { label: "Analytics", disabled: true },
  { label: "Settings", disabled: true },
];

export default function TeacherLayout() {
  return (
    <AppShell role="teacher" roleLabel="Teacher workspace" nav={NAV}>
      <Outlet />
    </AppShell>
  );
}
