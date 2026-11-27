import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import SetupGate from "./components/SetupGate.jsx";
import { HomeRedirect, RequireRole } from "./components/RouteGuards.jsx";

import StudentLayout from "./layouts/StudentLayout.jsx";
import TeacherLayout from "./layouts/TeacherLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

import Setup from "./pages/auth/Setup.jsx";
import Login from "./pages/auth/Login.jsx";

import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentCourses from "./pages/student/Courses.jsx";
import StudentAssignments from "./pages/student/Assignments.jsx";
import SubmitAssignment from "./pages/student/SubmitAssignment.jsx";

import TeacherDashboard from "./pages/teacher/Dashboard.jsx";
import TeacherCourses from "./pages/teacher/Courses.jsx";
import TeacherCourse from "./pages/teacher/Course.jsx";
import ReviewQueue from "./pages/teacher/ReviewQueue.jsx";
import Submissions from "./pages/teacher/Submissions.jsx";
import Report from "./pages/teacher/Report.jsx";

import AdminDashboard from "./pages/admin/Dashboard.jsx";
import Students from "./pages/admin/Students.jsx";
import Teachers from "./pages/admin/Teachers.jsx";
import CoursesTerms from "./pages/admin/CoursesTerms.jsx";
import SystemSettings from "./pages/admin/SystemSettings.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SetupGate>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/login" element={<Login />} />

            <Route path="/student" element={<RequireRole role="student"><StudentLayout /></RequireRole>}>
              <Route index element={<StudentDashboard />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="assignments/:assignmentId" element={<SubmitAssignment readOnly />} />
              <Route path="assignments/:assignmentId/submit" element={<SubmitAssignment />} />
            </Route>

            <Route path="/teacher" element={<RequireRole role="teacher"><TeacherLayout /></RequireRole>}>
              <Route index element={<TeacherDashboard />} />
              <Route path="courses" element={<TeacherCourses />} />
              <Route path="courses/:courseId" element={<TeacherCourse />} />
              <Route path="review" element={<ReviewQueue />} />
              <Route path="assignments/:assignmentId" element={<Submissions />} />
              <Route path="pairs/:pairId" element={<Report />} />
            </Route>

            <Route path="/admin" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="users" element={<Navigate to="/admin/students" replace />} />
              <Route path="courses" element={<CoursesTerms />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SetupGate>
      </AuthProvider>
    </BrowserRouter>
  );
}
