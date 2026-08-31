import {
  Home2,
  Teacher,
  Profile2User,
  Briefcase,
  Book,
  Calendar,
  CalendarTick,
  Card,
  VolumeHigh,
  Setting2,
  MagicStar,
  ClipboardTick,
  StatusUp,
  Chart,
  ShieldTick,
  Medal,
} from "iconsax-react";
import type { NavSection } from "../types";

export const adminNavSections: NavSection[] = [
  {
    items: [
      { label: "Home", to: "/admin", Icon: Home2, end: true, roles: ["principal", "school_admin"] },
      { label: "Students", to: "/admin/students", Icon: Teacher, roles: ["principal", "school_admin"] },
      {
        label: "Staff",
        to: "/admin/staff",
        Icon: Briefcase,
        hasCaret: true,
        roles: ["principal", "school_admin"],
        children: [
          { label: "Teachers", to: "/admin/teachers" },
          { label: "Non-Teachers", to: "/admin/staff" },
        ],
      },
      { label: "Parents", to: "/admin/parents", Icon: Profile2User, roles: ["principal", "school_admin"] },
    ],
  },
  {
    divider: true,
    items: [
      { label: "Classes", to: "/admin/classes", Icon: Teacher, roles: ["principal", "school_admin"] },
      { label: "Promotion", to: "/admin/promotion", Icon: Medal, roles: ["principal", "school_admin"] },
      { label: "Subjects", to: "/admin/subjects", Icon: Book, roles: ["principal", "school_admin"] },
      { label: "Timetable", to: "/admin/timetable", Icon: CalendarTick, roles: ["principal", "school_admin"] },
      { label: "Attendance", to: "/admin/attendance", Icon: ClipboardTick, roles: ["principal", "school_admin"] },
      { label: "Approvals", to: "/admin/approvals", Icon: ShieldTick, roles: ["principal", "school_admin"] },
      {
        label: "CA & Exams",
        to: "/admin/examinations",
        Icon: StatusUp,
        roles: ["principal", "school_admin"],
        children: [{ label: "Configure", to: "/admin/examinations/configure" }],
      },
      {
        label: "Calendar",
        to: "/admin/calendar",
        Icon: Calendar,
        hasCaret: true,
        roles: ["principal", "school_admin"],
        children: [
          { label: "Events", to: "/admin/calendar/events" },
          { label: "Holidays", to: "/admin/calendar/holidays" },
          { label: "Terms", to: "/admin/calendar/terms" },
        ],
      },
    ],
  },
  {
    divider: true,
    items: [
      {
        label: "Finance",
        to: "/admin/finance",
        Icon: Card,
        hasCaret: true,
        roles: ["principal", "school_admin", "bursar"],
        children: [
          { label: "Overview", to: "/admin/finance", end: true },
          { label: "Fee Structures", to: "/admin/finance/fee-structures" },
          { label: "Invoices", to: "/admin/finance/invoices" },
          { label: "Payments", to: "/admin/finance/payments" },
          { label: "Pending Verification", to: "/admin/finance/pending" },
        ],
      },
      { label: "Moments", to: "/admin/moments", Icon: MagicStar, roles: ["principal", "school_admin"] },
      { label: "Reports", to: "/admin/reports", Icon: Chart, roles: ["principal", "school_admin"] },
    ],
  },
  {
    divider: true,
    items: [
      { label: "Announcements", to: "/admin/announcements", Icon: VolumeHigh, roles: ["principal", "school_admin", "bursar"] },
      { label: "Settings", to: "/admin/settings", Icon: Setting2, roles: ["principal", "school_admin", "bursar"] },
    ],
  },
];