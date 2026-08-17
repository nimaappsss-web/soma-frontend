import { TickCircle, CloseCircle, Clock } from "iconsax-react";
import { cn } from "@/lib/utils";

export type ChildAttendanceStatus = "present" | "absent" | "late" | null;

const META: Record<"present" | "absent" | "late", { label: string; icon: typeof TickCircle; iconColor: string; pill: string }> = {
  present: {
    label: "Present in school today",
    icon: TickCircle,
    iconColor: "#34A853",
    pill: "bg-green-50 text-springgreen600",
  },
  late: {
    label: "Late to school today",
    icon: Clock,
    iconColor: "#FBBC05",
    pill: "bg-amber-50 text-amber-500",
  },
  absent: {
    label: "Absent today",
    icon: CloseCircle,
    iconColor: "#CD432F",
    pill: "bg-red-50 text-red500",
  },
};

const UNKNOWN = {
  label: "No attendance marked yet today",
  icon: Clock,
  iconColor: "#8C8C8C",
  pill: "bg-gray-50 text-gray500",
};

export const attendanceStatusLabel = (status: ChildAttendanceStatus): string =>
  status ? META[status].label : UNKNOWN.label;

export const AttendanceStatusPill = ({ status }: { status: ChildAttendanceStatus }) => {
  const meta = status ? META[status] : UNKNOWN;
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full", meta.pill)}>
      <Icon size={13} color={meta.iconColor} variant="Bold" />
      {meta.label}
    </span>
  );
};

/** Compact month summary line, e.g. "14 present · 2 absent · 16 school days" */
export const attendanceMonthSummary = (records: { date: string; status: string }[], month: string) => {
  const monthRecords = records.filter((r) => r.date.startsWith(month));
  const present = monthRecords.filter((r) => r.status === "present" || r.status === "late").length;
  const absent = monthRecords.filter((r) => r.status === "absent").length;
  return { present, absent, total: monthRecords.length };
};