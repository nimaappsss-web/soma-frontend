import { useMemo } from "react";
import { useClasses } from "../../principal/api/useClasses";
import { SelectDropdown } from "@/components/ui/select-dropdown";

interface ClassFilterProps {
  value: string;
  onChange: (classId: string) => void;
  className?: string;
}

export const ClassFilter = ({ value, onChange, className }: ClassFilterProps) => {
  const { data } = useClasses();

  const options = useMemo(
    () => [
      { value: "", label: "Whole school" },
      ...(data?.classes ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [data],
  );

  return (
    <SelectDropdown
      options={options}
      value={value}
      onChange={onChange}
      className={className}
      buttonClassName="w-full sm:w-48"
    />
  );
};
