import { Routes, Route, Navigate } from "react-router";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { GuestRoute } from "./components/auth/GuestRoute";
import { OnboardingRoute } from "./components/auth/OnboardingRoute";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { AdminDashboard } from "./pages/AdminDashboard";
import { TeacherDashboard } from "./pages/teach/TeacherDashboard";
import { TeacherStudents } from "./pages/teach/TeacherStudents";
import { TeacherAttendance } from "./pages/teach/TeacherAttendance";
import { ParentDashboard } from "./pages/ParentDashboard";
import { StaffDashboard } from "./pages/StaffDashboard";
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
          path="/continuous-assessment"
          element={
            <ProtectedRoute>
              <ContinuousAssessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/teach" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teach/students" element={<ProtectedRoute><TeacherStudents /></ProtectedRoute>} />
        <Route path="/teach/attendance" element={<ProtectedRoute><TeacherAttendance /></ProtectedRoute>} />
        <Route
          path="/parent"
          element={
            <ProtectedRoute>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <StaffDashboard />
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
        <Route path="/verify-teacher" element={<VerifyTeacher />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
