import {
  Home,
  Book,
  ClipboardTick,
  Profile2User,
  VolumeHigh,
  Setting,
  StatusUp,
  CalendarTick,
} from "iconsax-react";
import type { NavItem } from "../types";

export const teacherNavItems: NavItem[] = [
  { label: "Home", to: "/teach", Icon: Home, end: true },
  { label: "Subjects", to: "/teach/subjects", Icon: Book },
  { label: "Attendance", to: "/teach/attendance", Icon: ClipboardTick },
  { label: "Students", to: "/teach/students", Icon: Profile2User },
  {
    label: "CA & Exams",
    to: "/teach/ca-and-exams/mark-scores",
    Icon: StatusUp,
    hasCaret: true,
    children: [
      { label: "Mark Scores", to: "/teach/ca-and-exams/mark-scores" },
      { label: "My Class", to: "/teach/ca-and-exams/my-class" },
      { label: "Broadcast", to: "/teach/ca-and-exams/broadcast" },
      { label: "Active", to: "/teach/ca-and-exams/active" },
    ],
  },
  { label: "Timetable", to: "/teach/timetable", Icon: CalendarTick },
  { label: "Announcements", to: "/teach/announcements", Icon: VolumeHigh },
];

export const teacherSettingsItem: NavItem = { label: "Settings", to: "/teach/settings", Icon: Setting };