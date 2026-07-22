import { Routes, Route, Navigate } from "react-router";

import { TeacherAttendance } from "./pages/teach/TeacherAttendance";
import { TeacherLessonNotes } from "./pages/teach/TeacherLessonNotes";
import { TeacherSettings } from "./pages/teach/TeacherSettings";
import { OnboardingRoute } from "./features/auth/components/OnboardingRoute";
import { ContinuousAssessment } from "./pages/ContinuousAssessment";
import { CompleteRegistration } from "./pages/CompleteRegistration";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { TeacherDashboard } from "./pages/teach/TeacherDashboard";
import { useAnimatedFavicon } from "./hooks/useAnimatedFavicon";
import { TeacherStudents } from "./pages/teach/TeacherStudents";
import { AdminStudents } from "./pages/admin/AdminStudents";
import { AdminTeachers } from "./pages/admin/AdminTeachers";
import { AdminSubjects } from "./pages/admin/AdminSubjects";
import { ParentDashboard } from "./pages/ParentDashboard";
import { ParentSetup } from "./pages/ParentSetup";
import { GuestRoute } from "./features/auth/components/GuestRoute";
import { AdminClasses } from "./pages/admin/AdminClasses";
import { AdminParents } from "./pages/admin/AdminParents";
import { StaffDashboard } from "./pages/StaffDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { VerifyTeacher } from "./pages/VerifyTeacher";
import { AuthProvider } from "./contexts/AuthContext";
import { SyncProvider } from "./contexts/SyncContext";
import { SyncIndicator } from "./components/SyncIndicator";
import { InstallPWA } from "./components/InstallPWA";
import { InitialSyncProvider } from "./sync/InitialSyncProvider";
import { AdminSettings } from "./pages/AdminSettings";
import { AdminProfile } from "./pages/admin/AdminProfile";
import { Onboarding } from "./pages/Onboarding";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Settings } from "./pages/Settings";

function App() {
  useAnimatedFavicon(["/favicon2.svg", "/favicon.svg"], [3000, 600]);

  return (
    <AuthProvider>
      <SyncProvider>
      <InitialSyncProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <GuestRoute>
              <ResetPassword />
            </GuestRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <Onboarding />
            </OnboardingRoute>
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
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teach"
          element={
            <ProtectedRoute>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute>
              <AdminStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/parents"
          element={
            <ProtectedRoute>
              <AdminParents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute>
              <AdminTeachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute>
              <AdminClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute>
              <AdminSubjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute>
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teach/students"
          element={
            <ProtectedRoute>
              <TeacherStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teach/attendance"
          element={
            <ProtectedRoute>
              <TeacherAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teach/lesson-notes"
          element={
            <ProtectedRoute>
              <TeacherLessonNotes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teach/settings"
          element={
            <ProtectedRoute>
              <TeacherSettings />
            </ProtectedRoute>
          }
        />
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
        <Route path="/parent/setup" element={<ParentSetup />} />
        <Route path="/settings" element={<Navigate to="/settings/account" replace />} />
        <Route
          path="/settings/:tab"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <SyncIndicator />
      <InstallPWA />
      </InitialSyncProvider>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;
