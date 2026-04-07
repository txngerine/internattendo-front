import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/AdminDashboard";
import InternDashboard from "./pages/InternDashboard";

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "Admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/intern" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["Admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/intern"
        element={
          <ProtectedRoute roles={["Intern"]}>
            <InternDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<HomeRedirect />} />
    </Routes>
  );
}
