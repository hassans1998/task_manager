import { Routes, Route, Navigate } from "react-router-dom";
import SignUpForm from "./components/SignUpForm";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Projects from "./components/Projects"; // <-- add this
import ResetPassword from "./components/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signup" replace />} />
      <Route path="/signup" element={<SignUpForm />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />

      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/signup" replace />} />
    </Routes>
  );
}
