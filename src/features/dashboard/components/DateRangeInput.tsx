import { DateInput } from "@/components/ui/date-input";
import { cn } from "@/lib/utils";

interface DateRangeInputProps {
  from?: string;
  to?: string;
  onFromChange?: (date: string) => void;
  onToChange?: (date: string) => void;
  className?: string;
}

export const DateRangeInput = ({
  from = "",
  to = "",
  onFromChange,
  onToChange,
  className,
}: DateRangeInputProps) => (
  <div className={cn("flex items-center gap-0", className)}>
    <DateInput
      value={from}
      onChange={onFromChange}
      label="From"
      className="rounded-r-none border-r-0"
    />
    <div className="w-px h-5 bg-gray200" />
    <DateInput
      value={to}
      onChange={onToChange}
      label="To"
      className="rounded-l-none"
    />
  </div>
);
