import { useState } from "react";
import { Teacher, Briefcase, VolumeHigh, Book } from "iconsax-react";
import { DateRangeInput } from "./DateRangeInput";
import { TermDropdown } from "./TermDropdown";
import { QuickAddButton } from "../../../components/others/QuickAddButton";

const termOptions = [
  { value: "2025/2026-1", label: "2025/2026 session - 1st term" },
  { value: "2025/2026-2", label: "2025/2026 session - 2nd term" },
  { value: "2025/2026-3", label: "2025/2026 session - 3rd term" },
  { value: "2024/2025-1", label: "2024/2025 session - 1st term" },
  { value: "2024/2025-2", label: "2024/2025 session - 2nd term" },
  { value: "2024/2025-3", label: "2024/2025 session - 3rd term" },
];

const quickAddItems = [
  { label: "Student", icon: <Teacher variant="Bold" size={16} />, href: "/admin/students", bgColor: "bg-blue-100", iconColor: "#2563EB" },
  { label: "Teacher", icon: <Briefcase variant="Bold" size={16} />, href: "/admin/teachers", bgColor: "bg-purple-100", iconColor: "#9333EA" },
  { label: "Announcement", icon: <VolumeHigh variant="Bold" size={16} />, href: "/admin/announcements", bgColor: "bg-orange-100", iconColor: "#EA580C" },
  { label: "Subject", icon: <Book variant="Bold" size={16} />, href: "/admin/subjects", bgColor: "bg-green-100", iconColor: "#16A34A" },
];

export const DateFilterBar = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [term, setTerm] = useState("2025/2026-1");

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="flex items-center gap-3">
        <DateRangeInput from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <span className="text-sm text-gray400 font-medium">or</span>
        <TermDropdown options={termOptions} value={term} onChange={setTerm} />
      </div>
      <QuickAddButton items={quickAddItems} />
    </div>
  );
};
