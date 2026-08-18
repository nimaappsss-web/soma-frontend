export type IconName =
  | "Home2" | "Teacher" | "Profile2User" | "Briefcase" | "Book" | "Book1"
  | "Calendar" | "CalendarTick" | "ClipboardTick" | "StatusUp" | "Card"
  | "MagicStar" | "Chart" | "VolumeHigh" | "Setting2" | "Setting"
  | "UserAdd" | "DocumentUpload" | "Send" | "Link2" | "AddCircle" | "Trash"
  | "Refresh" | "CalendarAdd" | "TickCircle" | "Lock" | "User" | "UserEdit"
  | "Logout" | "Clock" | "Filter" | "ProfileTick" | "Document"
  | "Note" | "Award" | "Star1";

export interface SearchItem {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: IconName;
  category: "page" | "action";
  roles: string[];
  keywords: string[];
}

export const searchIndex: SearchItem[] = [
  // ──────────────────────── PAGES ────────────────────────

  // Principal (school admin)
  { id: "page-home", label: "Dashboard", description: "View school overview and stats", path: "/admin", icon: "Home2", category: "page", roles: ["principal"], keywords: ["home", "overview", "stats"] },
  { id: "page-students", label: "Students", description: "Manage student records and admissions", path: "/admin/students", icon: "Teacher", category: "page", roles: ["principal"], keywords: ["pupil", "learner", "admission"] },
  { id: "page-teachers", label: "Teachers", description: "View and manage teaching staff", path: "/admin/teachers", icon: "Briefcase", category: "page", roles: ["principal"], keywords: ["staff", "faculty"] },
  { id: "page-staff", label: "Non-Teaching Staff", description: "Manage non-teaching staff members", path: "/admin/staff", icon: "Briefcase", category: "page", roles: ["principal"], keywords: ["non-teaching", "staff", "workers"] },
  { id: "page-parents", label: "Parents", description: "View and manage parent accounts", path: "/admin/parents", icon: "Profile2User", category: "page", roles: ["principal"], keywords: ["guardian", "mother", "father"] },
  { id: "page-classes", label: "Classes", description: "Create and manage class arms", path: "/admin/classes", icon: "Teacher", category: "page", roles: ["principal"], keywords: ["arm", "section", "jss", "sss"] },
  { id: "page-subjects", label: "Subjects", description: "Manage school subjects directory", path: "/admin/subjects", icon: "Book", category: "page", roles: ["principal"], keywords: ["course", "curriculum"] },
  { id: "page-timetable", label: "Timetable", description: "View and edit class timetables", path: "/admin/timetable", icon: "CalendarTick", category: "page", roles: ["principal"], keywords: ["schedule", "period", "lesson"] },
  { id: "page-attendance", label: "Attendance", description: "View attendance records and reports", path: "/admin/attendance", icon: "ClipboardTick", category: "page", roles: ["principal"], keywords: ["present", "absent", "roll call"] },
  { id: "page-examinations", label: "Examinations", description: "Manage exams and assessments", path: "/admin/examinations", icon: "StatusUp", category: "page", roles: ["principal"], keywords: ["exam", "test", "assessment"] },
  { id: "page-calendar", label: "Calendar", description: "School calendar events and terms", path: "/admin/calendar/events", icon: "Calendar", category: "page", roles: ["principal"], keywords: ["event", "date", "term"] },
  { id: "page-calendar-events", label: "Calendar Events", description: "View and create school events", path: "/admin/calendar/events", icon: "CalendarAdd", category: "page", roles: ["principal"], keywords: ["event", "activity", "function"] },
  { id: "page-calendar-holidays", label: "Holidays", description: "Manage school holidays", path: "/admin/calendar/holidays", icon: "Calendar", category: "page", roles: ["principal"], keywords: ["holiday", "break", "vacation"] },
  { id: "page-calendar-terms", label: "Academic Terms", description: "Manage terms and sessions", path: "/admin/calendar/terms", icon: "CalendarTick", category: "page", roles: ["principal"], keywords: ["term", "session", "semester"] },
  { id: "page-finance", label: "Finance", description: "School finances and tuition tracking", path: "/admin/finance", icon: "Card", category: "page", roles: ["principal", "school_admin", "bursar"], keywords: ["fee", "tuition", "payment", "money"] },
  { id: "page-moments", label: "Moments", description: "Birthdays and celebrations", path: "/admin/moments", icon: "MagicStar", category: "page", roles: ["principal"], keywords: ["birthday", "celebration", "anniversary"] },
  { id: "page-reports", label: "Reports", description: "School reports and analytics", path: "/admin/reports", icon: "Chart", category: "page", roles: ["principal"], keywords: ["analytics", "data", "insight"] },
  { id: "page-announcements", label: "Announcements", description: "Create and manage announcements", path: "/admin/announcements", icon: "VolumeHigh", category: "page", roles: ["principal"], keywords: ["notice", "broadcast", "news"] },
  { id: "page-settings", label: "Settings", description: "Account and school settings", path: "/admin/settings", icon: "Setting2", category: "page", roles: ["principal"], keywords: ["config", "preference", "account"] },
  { id: "page-profile", label: "Profile", description: "Edit your profile information", path: "/admin/settings", icon: "User", category: "page", roles: ["principal"], keywords: ["avatar", "personal", "info"] },
  { id: "page-admin-profile", label: "My Profile", description: "View and edit your principal profile", path: "/admin/profile", icon: "UserEdit", category: "page", roles: ["principal"], keywords: ["personal", "avatar", "name", "phone"] },
  { id: "page-attendance-classes", label: "Attendance by Class", description: "View attendance grouped by class", path: "/admin/attendance/classes", icon: "ClipboardTick", category: "page", roles: ["principal"], keywords: ["class", "per class", "roll", "record"] },
  { id: "page-attendance-absentees", label: "Absentees", description: "See students marked absent", path: "/admin/attendance/absentees", icon: "ClipboardTick", category: "page", roles: ["principal"], keywords: ["absent", "missing", "truant", "away"] },
  { id: "page-exam-configure", label: "Exam Configuration", description: "Configure assessment schemes and scoring", path: "/admin/examinations/configure", icon: "Setting2", category: "page", roles: ["principal"], keywords: ["scheme", "setup", "config", "assessment"] },
  { id: "page-timetable-configs", label: "Timetable Configurations", description: "Set up batch timetable configurations", path: "/admin/timetable/configs", icon: "Setting2", category: "page", roles: ["principal"], keywords: ["config", "batch", "setup", "schedule", "build"] },
  { id: "page-student-details", label: "Student Details", description: "View an individual student's full record", path: "/admin/students", icon: "User", category: "page", roles: ["principal", "teacher"], keywords: ["individual", "profile", "record", "pupil"] },
  { id: "page-teacher-details", label: "Teacher Details", description: "View an individual teacher's profile", path: "/admin/teachers", icon: "Briefcase", category: "page", roles: ["principal"], keywords: ["individual", "profile", "staff record", "faculty"] },
  { id: "page-class-details", label: "Class Details", description: "View a class roster and its information", path: "/admin/classes", icon: "Teacher", category: "page", roles: ["principal"], keywords: ["roster", "arm", "students in class", "section"] },

  // Teacher
  { id: "page-teach-home", label: "Teacher Dashboard", description: "Your class overview and assignments", path: "/teach", icon: "Home2", category: "page", roles: ["teacher"], keywords: ["home", "overview"] },
  { id: "page-teach-attendance", label: "Mark Attendance", description: "Record student attendance for today", path: "/teach/attendance", icon: "ClipboardTick", category: "page", roles: ["teacher"], keywords: ["present", "absent", "roll call"] },
  { id: "page-teach-students", label: "My Students", description: "View students in your form class", path: "/teach/students", icon: "Profile2User", category: "page", roles: ["teacher"], keywords: ["class", "pupil", "learner"] },
  { id: "page-teach-lesson-notes", label: "Lesson Notes", description: "Create and manage lesson notes", path: "/teach/lesson-notes", icon: "Book1", category: "page", roles: ["teacher"], keywords: ["plan", "scheme", "ai"] },
  { id: "page-teach-announcements", label: "Announcements", description: "View school announcements", path: "/teach/announcements", icon: "VolumeHigh", category: "page", roles: ["teacher"], keywords: ["notice", "news"] },
  { id: "page-teach-settings", label: "Teacher Settings", description: "Update your profile and password", path: "/teach/settings", icon: "Setting", category: "page", roles: ["teacher"], keywords: ["account", "config"] },
  { id: "page-teach-mark-scores", label: "Mark Scores", description: "Record CA and exam scores for your class", path: "/teach/ca-and-exams/mark-scores", icon: "StatusUp", category: "page", roles: ["teacher"], keywords: ["ca", "exam", "grade", "score"] },
  { id: "page-teach-active", label: "Active Assessments", description: "View assessments currently in progress", path: "/teach/ca-and-exams/active", icon: "Clock", category: "page", roles: ["teacher"], keywords: ["active", "ongoing", "test", "live"] },
  { id: "page-teach-my-class", label: "My Class Results", description: "View results for your form class", path: "/teach/ca-and-exams/my-class", icon: "Chart", category: "page", roles: ["teacher"], keywords: ["results", "report", "scores"] },
  { id: "page-continuous-assessment", label: "Continuous Assessment", description: "Record student CA scores", path: "/continuous-assessment", icon: "StatusUp", category: "page", roles: ["teacher", "principal"], keywords: ["ca", "assessment", "score", "record"] },
  { id: "page-teach-subjects", label: "My Subjects", description: "View the subjects assigned to you", path: "/teach/subjects", icon: "Book1", category: "page", roles: ["teacher"], keywords: ["subject", "course", "assigned", "classes"] },
  { id: "page-teach-timetable", label: "My Timetable", description: "View your personal class timetable", path: "/teach/timetable", icon: "CalendarTick", category: "page", roles: ["teacher"], keywords: ["schedule", "period", "lesson", "classes", "today"] },
  { id: "page-teach-assessments", label: "Assessments", description: "Overview of CA and exam assessments", path: "/teach/ca-and-exams", icon: "StatusUp", category: "page", roles: ["teacher"], keywords: ["ca", "exam", "assessment", "overview", "test"] },
  { id: "page-teach-report", label: "Student Report", description: "View a student's full term report", path: "/teach/ca-and-exams/my-class", icon: "Document", category: "page", roles: ["teacher"], keywords: ["report card", "performance", "term results", "grades"] },

  // Parent
  { id: "page-parent-home", label: "Parent Dashboard", description: "Your children's school overview", path: "/parent", icon: "Home2", category: "page", roles: ["parent"], keywords: ["home", "overview"] },
  { id: "page-parent-children", label: "My Children", description: "View your children's records and attendance", path: "/parent/children", icon: "Teacher", category: "page", roles: ["parent"], keywords: ["child", "kid", "son", "daughter", "attendance", "present", "absent", "today"] },
  { id: "page-parent-fees", label: "School Fees", description: "View and pay your children's school fees", path: "/parent/fees", icon: "Card", category: "page", roles: ["parent"], keywords: ["fee", "tuition", "payment", "pay", "invoice"] },
  { id: "page-parent-announcements", label: "Announcements", description: "Read school announcements", path: "/parent/announcements", icon: "VolumeHigh", category: "page", roles: ["parent"], keywords: ["notice", "news"] },
  { id: "page-parent-settings", label: "Parent Settings", description: "Manage your account", path: "/parent/settings", icon: "Setting", category: "page", roles: ["parent"], keywords: ["account", "config"] },
  { id: "page-parent-today", label: "Today at School", description: "See today's attendance for your children", path: "/parent", icon: "ClipboardTick", category: "page", roles: ["parent"], keywords: ["attendance", "today", "present", "absent", "status"] },
  { id: "page-parent-events", label: "Upcoming Events", description: "School calendar events set by the principal", path: "/parent", icon: "Calendar", category: "page", roles: ["parent"], keywords: ["event", "calendar", "upcoming", "schedule"] },

  // Staff (non-teaching)
  { id: "page-staff-home", label: "Staff Dashboard", description: "Your overview as non-teaching staff", path: "/staff", icon: "Home2", category: "page", roles: ["staff"], keywords: ["home", "overview", "non-teaching"] },

  // Bursar (finance)
  { id: "page-bursar-overview", label: "Finance Overview", description: "School finances and revenue tracking", path: "/admin/finance", icon: "Card", category: "page", roles: ["bursar"], keywords: ["finance", "overview", "revenue", "money"] },
  { id: "page-bursar-fee-structures", label: "Fee Structures", description: "Create and manage fee structures", path: "/admin/finance/fee-structures", icon: "Card", category: "page", roles: ["bursar"], keywords: ["fee", "structure", "tuition", "items"] },
  { id: "page-bursar-invoices", label: "Invoices", description: "Generate and track student invoices", path: "/admin/finance/invoices", icon: "Document", category: "page", roles: ["bursar"], keywords: ["invoice", "bill", "charge", "fee"] },
  { id: "page-bursar-payments", label: "Payments", description: "View recorded payments and receipts", path: "/admin/finance/payments", icon: "Card", category: "page", roles: ["bursar"], keywords: ["payment", "receipt", "paid", "record"] },
  { id: "page-bursar-pending", label: "Pending Verification", description: "Confirm parent transfers and payments", path: "/admin/finance/pending", icon: "Clock", category: "page", roles: ["bursar"], keywords: ["pending", "verify", "confirm", "transfer", "review"] },

  // ──────────────────────── ACTIONS ────────────────────────

  // Student actions
  { id: "action-add-student", label: "Add Student", description: "Create a new student record", path: "/admin/students", icon: "UserAdd", category: "action", roles: ["principal"], keywords: ["create", "new", "enroll", "admit"] },
  { id: "action-bulk-add-students", label: "Bulk Add Students", description: "Upload CSV to add multiple students", path: "/admin/students", icon: "DocumentUpload", category: "action", roles: ["principal"], keywords: ["import", "csv", "batch", "many"] },
  { id: "action-filter-students", label: "Filter Students", description: "Filter student list by class or status", path: "/admin/students", icon: "Filter", category: "action", roles: ["principal"], keywords: ["search", "narrow", "class"] },

  // Teacher invite actions
  { id: "action-invite-teacher", label: "Invite Teacher", description: "Send email invitation to a teacher", path: "/admin/teachers", icon: "Send", category: "action", roles: ["principal"], keywords: ["email", "onboard", "new staff"] },
  { id: "action-invite-link", label: "Generate Invite Link", description: "Create a shareable teacher signup link", path: "/admin/teachers", icon: "Link2", category: "action", roles: ["principal"], keywords: ["shareable", "link", "url"] },
  { id: "action-resend-invite", label: "Resend Teacher Invite", description: "Resend a pending teacher invitation", path: "/admin/teachers", icon: "Refresh", category: "action", roles: ["principal"], keywords: ["resend", "invite", "pending"] },

  // Class actions
  { id: "action-add-class", label: "Add Class", description: "Create a new class arm", path: "/admin/classes", icon: "AddCircle", category: "action", roles: ["principal"], keywords: ["create", "new", "arm", "section"] },
  { id: "action-delete-class", label: "Delete Class", description: "Remove a class from the system", path: "/admin/classes", icon: "Trash", category: "action", roles: ["principal"], keywords: ["remove", "delete"] },

  // Subject actions
  { id: "action-add-subject", label: "Add Subject", description: "Create a new subject", path: "/admin/subjects", icon: "AddCircle", category: "action", roles: ["principal"], keywords: ["create", "new", "course"] },
  { id: "action-delete-subject", label: "Delete Subject", description: "Remove a subject from directory", path: "/admin/subjects", icon: "Trash", category: "action", roles: ["principal"], keywords: ["remove", "delete"] },

  // Announcement actions
  { id: "action-create-announcement", label: "Create Announcement", description: "Publish a school-wide announcement", path: "/admin/announcements", icon: "VolumeHigh", category: "action", roles: ["principal"], keywords: ["new", "broadcast", "notice", "publish"] },

  // Calendar actions
  { id: "action-add-event", label: "Add Calendar Event", description: "Create a school event or activity", path: "/admin/calendar/events", icon: "CalendarAdd", category: "action", roles: ["principal"], keywords: ["create", "new", "event", "function"] },
  { id: "action-add-holiday", label: "Add Holiday", description: "Mark a non-school day", path: "/admin/calendar/holidays", icon: "CalendarAdd", category: "action", roles: ["principal"], keywords: ["create", "new", "break", "vacation"] },
  { id: "action-add-term", label: "Add Academic Term", description: "Define a new school term", path: "/admin/calendar/terms", icon: "CalendarAdd", category: "action", roles: ["principal"], keywords: ["create", "new", "session", "semester"] },
  { id: "action-set-active-term", label: "Set Active Term", description: "Mark a term as currently active", path: "/admin/calendar/terms", icon: "TickCircle", category: "action", roles: ["principal"], keywords: ["activate", "current", "switch"] },
  { id: "action-setup-timetable-config", label: "Set Up Timetable Configuration", description: "Configure how class timetables are built", path: "/admin/timetable/configs", icon: "Setting2", category: "action", roles: ["principal"], keywords: ["configure", "batch", "setup", "build", "generate"] },

  // Settings actions (shared)
  { id: "action-change-password", label: "Change Password", description: "Update your login password", path: "/admin/settings", icon: "Lock", category: "action", roles: ["principal", "school_admin", "teacher", "parent", "staff", "bursar"], keywords: ["security", "login", "credentials"] },
  { id: "action-update-profile", label: "Update Profile", description: "Edit your personal information", path: "/admin/settings", icon: "UserEdit", category: "action", roles: ["principal", "school_admin", "teacher", "parent", "staff", "bursar"], keywords: ["name", "phone", "avatar", "picture"] },
  { id: "action-update-school", label: "Update School Details", description: "Edit school name, type, and address", path: "/admin/settings", icon: "Setting2", category: "action", roles: ["principal", "school_admin"], keywords: ["name", "type", "address", "config"] },

  // Teacher-specific actions
  { id: "action-mark-attendance", label: "Mark Attendance", description: "Record present/absent for your class", path: "/teach/attendance", icon: "ClipboardTick", category: "action", roles: ["teacher"], keywords: ["record", "present", "absent"] },
  { id: "action-view-attendance-history", label: "View Attendance History", description: "See past attendance records", path: "/teach/attendance", icon: "Clock", category: "action", roles: ["teacher"], keywords: ["past", "history", "previous"] },
  { id: "action-new-lesson-note", label: "New Lesson Note", description: "Create a blank lesson note", path: "/teach/lesson-notes", icon: "Document", category: "action", roles: ["teacher"], keywords: ["create", "new", "plan"] },
  { id: "action-generate-lesson-note", label: "Generate Lesson Note with AI", description: "AI-generate a lesson plan from subject and week", path: "/teach/lesson-notes", icon: "MagicStar", category: "action", roles: ["teacher"], keywords: ["ai", "auto", "generate", "plan"] },
  { id: "action-view-form-class", label: "View My Form Class", description: "See students in your assigned form class", path: "/teach", icon: "ProfileTick", category: "action", roles: ["teacher"], keywords: ["class", "students", "assigned"] },
  { id: "action-record-scores", label: "Record CA & Exam Scores", description: "Enter scores for your class assessments", path: "/teach/ca-and-exams/mark-scores", icon: "ClipboardTick", category: "action", roles: ["teacher"], keywords: ["score", "grade", "marks", "record"] },
  { id: "action-view-class-results", label: "View My Class Results", description: "Open results for your form class", path: "/teach/ca-and-exams/my-class", icon: "Chart", category: "action", roles: ["teacher"], keywords: ["results", "report", "grade", "scores"] },
  { id: "action-view-student-report", label: "View Student Report", description: "Open a student's term report card", path: "/teach/ca-and-exams/my-class", icon: "Document", category: "action", roles: ["teacher"], keywords: ["report", "performance", "result card", "term"] },
  { id: "action-view-teacher-timetable", label: "View My Timetable", description: "See your schedule of classes and periods", path: "/teach/timetable", icon: "CalendarTick", category: "action", roles: ["teacher"], keywords: ["schedule", "today", "period", "classes"] },

  // Sign out (all roles)
  { id: "action-sign-out", label: "Sign Out", description: "Log out of the application", path: "/login", icon: "Logout", category: "action", roles: ["principal", "school_admin", "teacher", "parent", "staff", "bursar"], keywords: ["logout", "exit", "leave"] },

  // Bursar actions
  { id: "action-generate-invoices", label: "Generate Invoices", description: "Generate invoices for a class or all students", path: "/admin/finance/invoices", icon: "DocumentUpload", category: "action", roles: ["principal", "school_admin", "bursar"], keywords: ["generate", "create", "invoice", "bulk"] },
  { id: "action-record-payment", label: "Record Payment", description: "Record a payment received from a parent", path: "/admin/finance/payments", icon: "Card", category: "action", roles: ["principal", "school_admin", "bursar"], keywords: ["payment", "record", "received", "money", "cash"] },
  { id: "action-verify-payment", label: "Verify Payment", description: "Confirm a parent's transfer or pending payment", path: "/admin/finance/pending", icon: "TickCircle", category: "action", roles: ["principal", "school_admin", "bursar"], keywords: ["verify", "confirm", "pending", "approve", "transfer"] },
  { id: "action-send-reminder", label: "Send Payment Reminder", description: "Remind parents about outstanding fees", path: "/admin/finance/invoices", icon: "VolumeHigh", category: "action", roles: ["principal", "school_admin", "bursar"], keywords: ["reminder", "outstanding", "due", "notify"] },

  // Parent actions
  { id: "action-parent-pay-fees", label: "Pay School Fees", description: "Make a payment for your child's fees", path: "/parent/fees", icon: "Card", category: "action", roles: ["parent"], keywords: ["pay", "fee", "transfer", "card", "payment"] },
  { id: "action-parent-attendance", label: "Check Today's Attendance", description: "See if your child was present today", path: "/parent/children", icon: "ClipboardTick", category: "action", roles: ["parent"], keywords: ["attendance", "today", "present", "absent", "check"] },
  { id: "action-parent-events", label: "View School Events", description: "See upcoming events from the school calendar", path: "/parent", icon: "CalendarAdd", category: "action", roles: ["parent"], keywords: ["events", "calendar", "upcoming", "schedule"] },

  // ─── Missing pages ───

  // Parent
  { id: "page-parent-exams", label: "Exams & Tests", description: "View your children's exam results and test scores", path: "/parent/exams", icon: "Document", category: "page", roles: ["parent"], keywords: ["exam", "test", "result", "score", "assessment", "grade"] },

  // Teacher detail pages
  { id: "page-teach-subject-detail", label: "Subject Detail", description: "View details for a specific subject and its assigned classes", path: "/teach/subjects", icon: "Book1", category: "page", roles: ["teacher"], keywords: ["subject", "class", "detail", "assigned", "classes"] },
  { id: "page-teach-student-report-view", label: "Student Report Card", description: "View a single student's full term report card", path: "/teach/ca-and-exams/my-class", icon: "Document", category: "page", roles: ["teacher"], keywords: ["report card", "student report", "term result", "performance", "grades"] },
  { id: "page-teach-student-details", label: "Student Details", description: "View an individual student's full record", path: "/teach/students", icon: "User", category: "page", roles: ["teacher"], keywords: ["individual", "profile", "record", "pupil"] },

  // Principal detail pages
  { id: "page-fee-structure-details", label: "Fee Structure Details", description: "View the breakdown of fees for a specific class", path: "/admin/finance/fee-structures", icon: "Card", category: "page", roles: ["principal", "bursar"], keywords: ["fee", "structure", "breakdown", "class fees", "tuition details"] },
  { id: "page-timetable-class-view", label: "Class Timetable", description: "View the timetable for a specific class", path: "/admin/timetable", icon: "CalendarTick", category: "page", roles: ["principal"], keywords: ["class", "schedule", "period", "timetable view"] },

  // Principal extra pages
  { id: "page-admin-profile", label: "My Profile", description: "View and edit your principal profile", path: "/admin/profile", icon: "UserEdit", category: "page", roles: ["principal"], keywords: ["personal", "avatar", "name", "phone"] },
];
