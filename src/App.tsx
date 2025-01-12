import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/login/login-page";
import AdminDashboard from "./pages/admin-dashboard/AdminDashboard";
import ManageCourses from "./pages/manage-courses/ManageCourses";
import { useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";
import AppSidebar from "./components/AppSidebar";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  console.log("App render - Current user:", user);
  console.log("Current path:", location.pathname);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user && !isLoginPage) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar currentRoute={location.pathname} />
      <main className="flex-1 overflow-y-auto">
        <div className="h-full p-6">
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/admin-dashboard" replace={false} />
                ) : (
                  <Navigate to="/login" replace={false} />
                )
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-courses"
              element={
                <ProtectedRoute>
                  <ManageCourses />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;