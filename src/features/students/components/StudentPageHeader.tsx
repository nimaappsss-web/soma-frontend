import { type ReactNode } from "react";
import {
  SelectDropdown,
  type SelectOption,
} from "../../../components/ui/select-dropdown";
import { PageHeader, type PageViewMode } from "../../../components/ui/PageHeader";

export type StudentViewMode = PageViewMode;

export const studentStatusOptions: SelectOption[] = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "GRADUATED", label: "Graduated" },
];

export const studentSortOptions: SelectOption[] = [
  { value: "az", label: "Sort by: A → Z" },
  { value: "za", label: "Sort by: Z → A" },
  { value: "last-first", label: "Sort by: Last – First" },
  { value: "first-last", label: "Sort by: First – Last" },
];

interface StudentPageHeaderProps {
  title?: string;
  subtitle?: ReactNode;
  classOptions: SelectOption[];
  classValue: string;
  onClassChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  view: StudentViewMode;
  onViewChange: (view: StudentViewMode) => void;
  actions?: ReactNode;
}

export const StudentPageHeader = ({
  title = "Students",
  subtitle,
  classOptions,
  classValue,
  onClassChange,
  statusValue,
  onStatusChange,
  sortValue,
  onSortChange,
  searchValue,
  onSearchChange,
  view,
  onViewChange,
  actions,
}: StudentPageHeaderProps) => {
  const filters = (
    <>
      <SelectDropdown
        value={classValue}
        onChange={onClassChange}
        placeholder="All Classes"
        options={classOptions}
        buttonClassName="h-[45px] text-sm"
        menuClassName="min-w-[180px]"
      />

      <SelectDropdown
        value={statusValue}
        onChange={onStatusChange}
        placeholder="All Status"
        options={studentStatusOptions}
        buttonClassName="h-[45px] text-sm"
        menuClassName="min-w-[180px]"
      />

      <SelectDropdown
        value={sortValue}
        onChange={onSortChange}
        placeholder="Sort by"
        options={studentSortOptions}
        buttonClassName="h-[45px] text-sm"
        menuClassName="min-w-[180px]"
      />
    </>
  );

  const mobileFilters = (
    <>
      <SelectDropdown
        value={classValue}
        onChange={onClassChange}
        placeholder="All Classes"
        options={classOptions}
        buttonClassName="h-10 text-sm"
        menuClassName="min-w-[200px]"
      />

      <SelectDropdown
        value={statusValue}
        onChange={onStatusChange}
        placeholder="All Status"
        options={studentStatusOptions}
        buttonClassName="h-10 text-sm"
        menuClassName="min-w-[200px]"
      />

      <SelectDropdown
        value={sortValue}
        onChange={onSortChange}
        placeholder="Sort by"
        options={studentSortOptions}
        buttonClassName="h-10 text-sm"
        menuClassName="min-w-[200px]"
      />
    </>
  );

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search student"
      filters={filters}
      mobileFilters={mobileFilters}
      view={view}
      onViewChange={onViewChange}
      actions={actions}
    />
  );
};
