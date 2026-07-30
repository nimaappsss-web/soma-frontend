import { Routes, Route, Navigate } from "react-router";

import { AdminLayout } from "./layouts/AdminLayout";
import { TeacherLayout } from "./layouts/TeacherLayout";
import { ParentLayout } from "./layouts/ParentLayout";
import { TeacherAttendance } from "./pages/teach/TeacherAttendance";
import { TeacherLessonNotes } from "./pages/teach/TeacherLessonNotes";
import { TeacherAnnouncements } from "./pages/teach/TeacherAnnouncements";
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
import { DashboardHome } from "./features/dashboard";
import { StaffManagement } from "./features/staff/components/StaffManagement";
import { FinanceManagement } from "./features/finance/components/FinanceManagement";
import { AnnouncementsManagement } from "./features/announcements/components/AnnouncementsManagement";
import { MomentsManagement } from "./features/moments/components/MomentsManagement";
import { TimetableManagement } from "./features/timetable/components/TimetableManagement";
import { AttendanceOverview } from "./features/attendance/components/AttendanceOverview";
import { ExaminationsManagement } from "./features/examinations/components/ExaminationsManagement";
import { CalendarLayout, CalendarEvents, CalendarHolidays, CalendarTerms } from "./features/calendar/components/CalendarManagement";
import { ReportsManagement } from "./features/reports/components/ReportsManagement";

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
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="parents" element={<AdminParents />} />
          <Route path="finance" element={<FinanceManagement />} />
          <Route path="announcements" element={<AnnouncementsManagement />} />
          <Route path="moments" element={<MomentsManagement />} />
          <Route path="timetable" element={<TimetableManagement />} />
          <Route path="attendance" element={<AttendanceOverview />} />
          <Route path="examinations" element={<ExaminationsManagement />} />
          <Route path="calendar" element={<CalendarLayout />}>
            <Route index element={<Navigate to="events" replace />} />
            <Route path="events" element={<CalendarEvents />} />
            <Route path="holidays" element={<CalendarHolidays />} />
            <Route path="terms" element={<CalendarTerms />} />
          </Route>
          <Route path="reports" element={<ReportsManagement />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="subjects" element={<AdminSubjects />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
        <Route path="/teach" element={<ProtectedRoute><TeacherLayout /></ProtectedRoute>}>
          <Route index element={<TeacherDashboard />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="lesson-notes" element={<TeacherLessonNotes />} />
          <Route path="announcements" element={<TeacherAnnouncements />} />
          <Route path="settings" element={<TeacherSettings />} />
        </Route>
        <Route path="/parent" element={<ProtectedRoute><ParentLayout /></ProtectedRoute>}>
          <Route index element={<ParentDashboard />} />
          <Route path="children" element={<ParentDashboard />} />
          <Route path="announcements" element={<ParentDashboard />} />
          <Route path="settings" element={<ParentDashboard />} />
        </Route>
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
        <Route path="/register" element={<VerifyTeacher />} />
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
