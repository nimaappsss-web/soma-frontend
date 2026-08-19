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
} from "iconsax-react";
import type { NavSection } from "../types";

export const adminNavSections: NavSection[] = [
  {
    items: [
      { label: "Home", to: "/admin", Icon: Home2, end: true, roles: ["principal", "school_admin", "bursar"] },
      { label: "Students", to: "/admin/students", Icon: Teacher },
      {
        label: "Staff",
        to: "/admin/staff",
        Icon: Briefcase,
        hasCaret: true,
        children: [
          { label: "Teachers", to: "/admin/teachers" },
          { label: "Non-Teachers", to: "/admin/staff" },
        ],
      },
      { label: "Parents", to: "/admin/parents", Icon: Profile2User },
    ],
  },
  {
    divider: true,
    items: [
      { label: "Classes", to: "/admin/classes", Icon: Teacher },
      { label: "Subjects", to: "/admin/subjects", Icon: Book },
      { label: "Timetable", to: "/admin/timetable", Icon: CalendarTick },
      { label: "Attendance", to: "/admin/attendance", Icon: ClipboardTick },
      { label: "Approvals", to: "/admin/approvals", Icon: ShieldTick },
      {
        label: "CA & Exams",
        to: "/admin/examinations",
        Icon: StatusUp,
        children: [{ label: "Configure", to: "/admin/examinations/configure" }],
      },
      {
        label: "Calendar",
        to: "/admin/calendar",
        Icon: Calendar,
        hasCaret: true,
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
      { label: "Moments", to: "/admin/moments", Icon: MagicStar },
      { label: "Reports", to: "/admin/reports", Icon: Chart },
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