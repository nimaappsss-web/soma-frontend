import { useState } from "react";
import { Teacher, Briefcase, VolumeHigh, Book } from "iconsax-react";
import { DateRangeInput } from "./DateRangeInput";
import { TermDropdown } from "./TermDropdown";
import { QuickAddButton } from "../../../components/others/QuickAddButton";
import { useActiveTerm } from "../../calendar/api";
import { termLabel } from "../../calendar/utils/term";

const quickAddItems = [
  { label: "Student", icon: <Teacher variant="Bold" size={16} />, href: "/admin/students", bgColor: "bg-blue-100", iconColor: "#2563EB" },
  { label: "Teacher", icon: <Briefcase variant="Bold" size={16} />, href: "/admin/teachers", bgColor: "bg-purple-100", iconColor: "#9333EA" },
  { label: "Announcement", icon: <VolumeHigh variant="Bold" size={16} />, href: "/admin/announcements", bgColor: "bg-orange-100", iconColor: "#EA580C" },
  { label: "Subject", icon: <Book variant="Bold" size={16} />, href: "/admin/subjects", bgColor: "bg-green-100", iconColor: "#16A34A" },
];

export const DateFilterBar = () => {
  const { terms, activeTerm } = useActiveTerm();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [term, setTerm] = useState<string>(activeTerm?.id ?? "");

  const termOptions = terms.map((t) => ({
    value: t.id,
    label: termLabel(t.term).label,
  }));

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangeInput from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <span className="text-sm text-gray400 font-medium">or</span>
        <TermDropdown options={termOptions} value={term} onChange={setTerm} />
      </div>
      <QuickAddButton items={quickAddItems} />
    </div>
  );
};
