import { Routes, Route, Navigate } from "react-router";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { GuestRoute } from "./components/auth/GuestRoute";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { AttendanceTest } from "./pages/AttendanceTest";
import { ContinuousAssessment } from "./pages/ContinuousAssessment";
import { CompleteRegistration } from "./pages/CompleteRegistration";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/onboarding" element={<GuestRoute><Onboarding /></GuestRoute>} />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AttendanceTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/continuous-assessment"
          element={
            <ProtectedRoute>
              <ContinuousAssessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complete-registration"
          element={
            <ProtectedRoute>
              <CompleteRegistration />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
