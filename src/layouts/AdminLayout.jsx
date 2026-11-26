import { Outlet } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import "../styles/admin.css";

const NAV = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/users", label: "User management" },
  { to: "/admin/courses", label: "Courses & terms" },
  { to: "/admin/settings", label: "System settings" },
  { label: "Audit log", disabled: true },
];

export default function AdminLayout() {
  return (
    <AppShell role="admin" roleLabel="Admin workspace" nav={NAV}>
      <Outlet />
    </AppShell>
  );
}
