import { Routes, Route, Navigate } from "react-router";

import { AdminLayout } from "./layouts/AdminLayout";
import { TeacherLayout } from "./layouts/TeacherLayout";
import { ParentLayout } from "./layouts/ParentLayout";
import { TeacherAttendance } from "./pages/teach/TeacherAttendance";
import { TeacherLessonNotes } from "./pages/teach/TeacherLessonNotes";
import { TeacherTimetable } from "./pages/teach/TeacherTimetable";
import { TeacherAnnouncements } from "./pages/teach/TeacherAnnouncements";
import { TeacherSettings } from "./pages/teach/TeacherSettings";
import { OnboardingRoute } from "./features/auth/components/OnboardingRoute";
import { ContinuousAssessment } from "./pages/ContinuousAssessment";
import { CompleteRegistration } from "./pages/CompleteRegistration";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { AdminRoleRoute } from "./features/auth/components/AdminRoleRoute";
import { TeacherDashboard } from "./pages/teach/TeacherDashboard";
import { TeacherSubjects } from "./pages/teach/TeacherSubjects";
import { SubjectDetail } from "./pages/teach/SubjectDetail";
import { TeacherExams } from "./pages/teach/TeacherExams";
import { TeacherActiveAssessments } from "./pages/teach/TeacherActiveAssessments";
import { TeacherResults } from "./pages/teach/TeacherResults";
import { TeacherBroadcast } from "./pages/teach/TeacherBroadcast";
import { StudentReportView } from "./features/examinations/components/StudentReportView";
import { TeacherExaminationsLayout, TeacherExaminationsIndex } from "./features/examinations/components/TeacherExaminationsLayout";
import { useAnimatedFavicon } from "./hooks/useAnimatedFavicon";
import { TeacherStudents } from "./pages/teach/TeacherStudents";
import { AdminStudents } from "./pages/admin/AdminStudents";
import { StudentDetails } from "./pages/StudentDetails";
import { AdminTeachers } from "./pages/admin/AdminTeachers";
import { AdminTeacherDetails } from "./pages/admin/AdminTeacherDetails";
import { AdminSubjects } from "./pages/admin/AdminSubjects";
import { ParentDashboard } from "./pages/ParentDashboard";
import { ParentChildren } from "./pages/ParentChildren";
import { ParentExams } from "./pages/ParentExams";
import { ParentAnnouncements } from "./pages/ParentAnnouncements";
import { ParentFees } from "./pages/ParentFees";
import { ParentSettings } from "./pages/ParentSettings";
import { ParentSetup } from "./pages/ParentSetup";
import { AcceptParentInvite } from "./pages/AcceptParentInvite";
import { GuestRoute } from "./features/auth/components/GuestRoute";
import { AdminClasses } from "./pages/admin/AdminClasses";
import { AdminPromotion } from "./pages/admin/AdminPromotion";
import { AdminApprovalClass } from "./pages/admin/AdminApprovalClass";
import { ClassDetails } from "./pages/admin/ClassDetails";
import { AdminParents } from "./pages/admin/AdminParents";
import { AdminApprovals } from "./pages/admin/AdminApprovals";
import { StaffDashboard } from "./pages/StaffDashboard";
import { VerifyTeacher } from "./pages/VerifyTeacher";
import { AuthProvider } from "./contexts/AuthContext";
import { SyncProvider } from "./contexts/SyncContext";
import { SyncIndicator } from "./components/SyncIndicator";
import { Toaster } from "./components/ui/Toaster";
import { PwaUpdateBanner } from "./components/ui/PwaUpdateBanner";
import { InstallPWA } from "./components/InstallPWA";
import { DeviceSyncBridge } from "./components/DeviceSyncBridge";
import { InitialSyncProvider } from "./sync/InitialSyncProvider";
import { AdminSettings } from "./pages/AdminSettings";
import { AdminProfile } from "./pages/admin/AdminProfile";
import { Onboarding } from "./pages/Onboarding";
import { Login } from "./pages/Login";
import { SetPassword } from "./pages/SetPassword";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Settings } from "./pages/Settings";
import { DashboardHome } from "./features/dashboard";
import { StaffManagement } from "./features/staff/components/StaffManagement";
import { FinanceLayout, FeeStructuresTab, InvoicesTab, PaymentsTab, PendingVerificationTab } from "./features/finance/components/FinanceManagement";
import { FinanceOverview } from "./features/finance/components/FinanceOverview";
import { FeeStructureDetails } from "./features/finance/components/FeeStructureDetails";
import { AnnouncementsManagement } from "./features/announcements/components/AnnouncementsManagement";
import { MomentsManagement } from "./features/moments/components/MomentsManagement";
import { TimetableManagement } from "./features/timetable/components/TimetableManagement";
import { TimetableConfigsPage } from "./features/timetable/components/TimetableConfigsPage";
import { TimetableLayout } from "./features/timetable/components/TimetableLayout";
import { TimetableView } from "./features/timetable/components/TimetableView";
import { AttendanceOverview } from "./features/attendance/components/AttendanceOverview";
import { AttendanceClasses } from "./features/attendance/components/AttendanceClasses";
import { AttendanceAbsentees } from "./features/attendance/components/AttendanceAbsentees";
import { ExaminationsLayout } from "./features/examinations/components/ExaminationsLayout";
import { SchemeConfig } from "./features/examinations/components/SchemeConfig";
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
          path="/set-password"
          element={
            <ProtectedRoute>
              <SetPassword />
            </ProtectedRoute>
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
          <Route element={<AdminRoleRoute />}>
            <Route index element={<DashboardHome />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="students/:id" element={<StudentDetails />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="teachers/:id" element={<AdminTeacherDetails />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="parents" element={<AdminParents />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="approvals/class/:classId" element={<AdminApprovalClass />} />
            <Route path="finance" element={<FinanceLayout />}>
              <Route index element={<FinanceOverview />} />
              <Route path="fee-structures" element={<FeeStructuresTab />} />
              <Route path="invoices" element={<InvoicesTab />} />
              <Route path="payments" element={<PaymentsTab />} />
              <Route path="pending" element={<PendingVerificationTab />} />
            </Route>
            <Route path="finance/fee-structures/:groupId" element={<FeeStructureDetails />} />
            <Route path="announcements" element={<AnnouncementsManagement />} />
            <Route path="moments" element={<MomentsManagement />} />
            <Route path="timetable" element={<TimetableLayout />}>
              <Route index element={<TimetableManagement />} />
              <Route path="configs" element={<TimetableConfigsPage />} />
              <Route path=":classId" element={<TimetableView />} />
            </Route>
            <Route path="attendance" element={<AttendanceOverview />} />
            <Route path="attendance/classes" element={<AttendanceClasses />} />
            <Route path="attendance/absentees" element={<AttendanceAbsentees />} />
            <Route path="examinations" element={<ExaminationsLayout />}>
              <Route index element={<SchemeConfig />} />
              <Route path="configure" element={<SchemeConfig />} />
            </Route>
            <Route path="calendar" element={<CalendarLayout />}>
              <Route index element={<Navigate to="events" replace />} />
              <Route path="events" element={<CalendarEvents />} />
              <Route path="holidays" element={<CalendarHolidays />} />
              <Route path="terms" element={<CalendarTerms />} />
            </Route>
            <Route path="reports" element={<ReportsManagement />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="promotion" element={<AdminPromotion />} />
            <Route path="classes/:classId" element={<ClassDetails />} />
            <Route path="reports/:studentId" element={<StudentReportView />} />
            <Route path="subjects" element={<AdminSubjects />} />
          </Route>
          <Route path="settings" element={<AdminSettings />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
        <Route path="/teach" element={<ProtectedRoute><TeacherLayout /></ProtectedRoute>}>
          <Route index element={<TeacherDashboard />} />
          <Route path="subjects" element={<TeacherSubjects />} />
          <Route path="subjects/:subjectId" element={<SubjectDetail />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="students/:id" element={<StudentDetails />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="ca-and-exams" element={<TeacherExaminationsLayout />}>
            <Route index element={<TeacherExaminationsIndex />} />
            <Route path="mark-scores" element={<TeacherExams />} />
            <Route path="active" element={<TeacherActiveAssessments />} />
          </Route>
          <Route path="ca-and-exams/broadcast" element={<TeacherBroadcast />} />
          <Route path="ca-and-exams/my-class" element={<TeacherResults />} />
          <Route path="ca-and-exams/reports/:studentId" element={<StudentReportView />} />
          <Route path="results" element={<Navigate to="/teach/ca-and-exams/my-class" replace />} />
          <Route path="lesson-notes" element={<TeacherLessonNotes />} />
          <Route path="timetable" element={<TeacherTimetable />} />
          <Route path="announcements" element={<TeacherAnnouncements />} />
          <Route path="settings" element={<TeacherSettings />} />
        </Route>
        <Route path="/parent" element={<ProtectedRoute><ParentLayout /></ProtectedRoute>}>
          <Route index element={<ParentDashboard />} />
          <Route path="children" element={<ParentChildren />} />
          <Route path="exams" element={<ParentExams />} />
          <Route path="fees" element={<ParentFees />} />
          <Route path="announcements" element={<ParentAnnouncements />} />
          <Route path="settings" element={<ParentSettings />} />
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
        <Route path="/accept-invite" element={<VerifyTeacher />} />
        <Route path="/verify-teacher" element={<VerifyTeacher />} />
        <Route path="/register" element={<VerifyTeacher />} />
        <Route path="/parent/setup" element={<ParentSetup />} />
        <Route path="/accept-parent-invite" element={<AcceptParentInvite />} />
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
      <Toaster />
      <InstallPWA />
      <PwaUpdateBanner />
      <DeviceSyncBridge />
      </InitialSyncProvider>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;
