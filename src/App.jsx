import { Routes, Route, Navigate } from "react-router-dom";
import SignUpForm from "./components/Auth/SignUpForm";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard";
import Projects from "./components/Projects";
import Timesheet from "./components/Timesheet";
import ResetPassword from "./components/Auth/ResetPassword";
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
      <Route
        path="/timesheet"
        element={
          <ProtectedRoute>
            <Timesheet />
          </ProtectedRoute>
        }
      />

      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/signup" replace />} />
    </Routes>
  );
}
