import { Routes, Route, Navigate } from "react-router";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { GuestRoute } from "./components/auth/GuestRoute";
import { OnboardingRoute } from "./components/auth/OnboardingRoute";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { Dashboard } from "./pages/Dashboard";
import { AttendanceTest } from "./pages/AttendanceTest";
import { ContinuousAssessment } from "./pages/ContinuousAssessment";
import { CompleteRegistration } from "./pages/CompleteRegistration";
import { VerifyTeacher } from "./pages/VerifyTeacher";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
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
        <Route path="/invite/:token" element={<VerifyTeacher />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
