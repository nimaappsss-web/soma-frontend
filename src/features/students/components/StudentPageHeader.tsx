import { useState, type ReactNode } from "react";
import { Filter, Grid2, RowVertical, SearchNormal } from "iconsax-react";

import { cn } from "@/lib/utils";
import {
  SelectDropdown,
  type SelectOption,
} from "../../../components/ui/select-dropdown";
import { BottomSheet } from "../../../components/mobile/BottomSheet";

export type StudentViewMode = "list" | "grid";

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
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="flex flex-row md:flex-col xl:flex-row items-center justify-between gap-3 mb-5">
      {/* Group 1: Title + Subtitle paired */}
      <div className="flex items-center gap-2.5 shrink-0">
        <h1 className="text-[18px] sm:text-2xl font-semibold text-gray-900">
          {title}
        </h1>
        {subtitle}
      </div>

      {/* Group 2: Filters + View toggle + Actions paired */}
      <div className="flex flex-1 items-center justify-end gap-2.5 flex-wrap xl:flex-nowrap">
        {/* Desktop inline filters */}
        <div className="hidden md:flex items-center gap-2.5 flex-wrap xl:flex-nowrap">
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

          <div className="relative flex-1 min-w-[150px] max-w-[260px]">
            <SearchNormal
              size={16}
              color="#B3B3B3"
              variant="Linear"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search student"
              className="h-[45px] w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm placeholder:text-placeholder focus-visible:outline-none"
            />
          </div>
        </div>

        {/* Mobile filter button */}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="flex md:hidden h-[44px] w-[44px] items-center justify-center rounded-[15px] border border-input bg-background shrink-0"
        >
          <Filter size={16} color="#0D0D0D" variant="Linear" />
        </button>

        <div className="flex h-[44px] items-center gap-1 rounded-[15px] border border-input bg-background p-1 shrink-0">
          <button
            type="button"
            onClick={() => onViewChange("list")}
            aria-label="List view"
            className={cn(
              "flex h-[30px] w-[30px] items-center justify-center rounded-[10px] transition-colors",
              view === "list" ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
            )}
          >
            <RowVertical size={16} color={view === "list" ? "#FFFFFF" : "#0D0D0D"} variant="Bold" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            aria-label="Grid view"
            className={cn(
              "flex h-[30px] w-[30px] items-center justify-center rounded-[10px] transition-colors",
              view === "grid" ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
            )}
          >
            <Grid2 size={16} color={view === "grid" ? "#FFFFFF" : "#0D0D0D"} variant="Bold" />
          </button>
        </div>

        {actions}
      </div>

      {/* Mobile filter bottom sheet */}
      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filters"
      >
        <div className="space-y-4">
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

          <div className="relative">
            <SearchNormal
              size={16}
              color="#B3B3B3"
              variant="Linear"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search student"
              className="h-10 w-full rounded-full border border-input bg-background pl-10 pr-4 text-sm placeholder:text-placeholder focus-visible:outline-none"
            />
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
