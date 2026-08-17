import {
  Home,
  Book,
  ClipboardTick,
  Profile2User,
  Book1,
  Speaker,
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
    ],
  },
  { label: "Lesson Notes", to: "/teach/lesson-notes", Icon: Book1 },
  { label: "Timetable", to: "/teach/timetable", Icon: CalendarTick },
  { label: "Announcements", to: "/teach/announcements", Icon: Speaker },
];

export const teacherSettingsItem: NavItem = { label: "Settings", to: "/teach/settings", Icon: Setting };