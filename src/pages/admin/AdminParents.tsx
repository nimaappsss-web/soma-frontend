import { useState } from "react";
import { ParentsListSection } from "../../features/principal/components/ParentsListSection";
import { HelpHint } from "../../components/ui/HelpHint";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  SelectDropdown,
  type SelectOption,
} from "../../components/ui/select-dropdown";

const parentStatusOptions: SelectOption[] = [
  { value: "all", label: "All Parents" },
  { value: "pending", label: "Pending" },
  { value: "registered", label: "Registered" },
];

export const AdminParents = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filters = (
    <SelectDropdown
      value={statusFilter}
      onChange={setStatusFilter}
      placeholder="All Parents"
      options={parentStatusOptions}
      buttonClassName="h-[45px] text-sm"
      menuClassName="min-w-[180px]"
    />
  );

  return (
    <div className="p-4 md:p-6 w-full">
      <PageHeader
        title="Parents"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search parent"
        filters={filters}
        mobileFilters={filters}
        hint={
          <HelpHint
            title="Parents"
            storageKey="parents"
            description="Track the guardians connected to your students."
            sections={[
              { title: "Invite parents", text: "Invite a parent by email so they can create a linked account and see their child's updates." },
              { title: "Pending invites", text: "Parents who haven't set up their account yet stay under Pending — resend their invite anytime." },
              { title: "Search & browse", text: "Use the search bar to find a parent by name or email, and open a record to see their linked students." },
            ]}
          />
        }
      />
      <ParentsListSection limit={50} search={search} statusFilter={statusFilter} />
    </div>
  );
};