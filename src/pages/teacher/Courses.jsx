import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useAsync } from "../../hooks/useAsync.js";
import { api } from "../../services/api.js";
import { Empty, ErrorMessage, Loading, PageHeader } from "../../components/ui.jsx";

/** "My Courses" opens the teacher's first course; the course page has tabs to switch. */
export default function TeacherCourses() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(() => api.getTeacherHome(user.id), [user.id]);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  if (data.courses.length) return <Navigate to={`/teacher/courses/${data.courses[0].id}`} replace />;
  return (
    <>
      <PageHeader title="My Courses" />
      <Empty>No courses are assigned to you yet. Ask your administrator to assign one.</Empty>
    </>
  );
}
