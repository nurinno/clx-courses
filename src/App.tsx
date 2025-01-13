import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/login/LoginPage";
import AdminDashboard from "./pages/admin-dashboard/AdminDashboard";
import ManageCourses from "./pages/manage-courses/ManageCourses";
import { useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";
import AppSidebar from "./components/AppSidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { SidebarProvider } from "@/components/ui/sidebar";
import LearnerDashboard from "./pages/learner-dashboard/LearnerDashboard";
import { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const App = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setUserRole(userDoc.exists() ? userDoc.data().role : "learner");
      } catch (error) {
        console.error("Error checking user role:", error);
        setUserRole("learner");
      }
    };

    checkUserRole();
  }, [user]);

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

  if (isLoginPage) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-full max-w-[400px] px-4">
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar currentRoute={location.pathname} />
        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-6">
            <Routes>
              <Route
                path="/"
                element={
                  user ? (
                    userRole === "admin" ? (
                      <Navigate to="/admin-dashboard" replace={false} />
                    ) : (
                      <Navigate to="/learner-dashboard" replace={false} />
                    )
                  ) : (
                    <Navigate to="/login" replace={false} />
                  )
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/manage-courses"
                element={
                  <AdminRoute>
                    <ManageCourses />
                  </AdminRoute>
                }
              />
              <Route path="/learner-dashboard" element={
                <ProtectedRoute>
                  <LearnerDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default App;