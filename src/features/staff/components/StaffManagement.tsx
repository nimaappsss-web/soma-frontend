import { useState } from "react";
import { Add, Briefcase, CloseCircle, Edit2, TickCircle, Trash } from "iconsax-react";

import { PageHeader } from "../../../components/ui/PageHeader";
import { HelpHint } from "../../../components/ui/HelpHint";
import { Button } from "../../../components/ui/button";
import { Avatar } from "../../../components/ui/Avatar";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SelectDropdown, type SelectOption } from "../../../components/ui/select-dropdown";
import { useStaffList, useDeleteStaff, useResendStaffInvite } from "../api";
import { InviteStaffModal } from "./InviteStaffModal";
import type { StaffMember, StaffStatus } from "../types";

const STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INVITED", label: "Invited" },
  { value: "INACTIVE", label: "Inactive" },
];

const ROLE_OPTIONS: SelectOption[] = [
  { value: "", label: "All roles" },
  { value: "STAFF", label: "Staff" },
  { value: "BURSAR", label: "Bursar" },
];

const StatusBadge = ({ status }: { status: StaffStatus }) => {
  if (status === "ACTIVE")
    return <span className="inline-flex items-center gap-1 rounded-full bg-springgreen600/10 px-2.5 py-1 text-xs font-medium text-springgreen600"><TickCircle size={12} color="#34A853" /> Active</span>;
  if (status === "INVITED")
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber500/10 px-2.5 py-1 text-xs font-medium text-amber500"><Edit2 size={12} color="#FBBC05" /> Invited</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-gray500/10 px-2.5 py-1 text-xs font-medium text-gray500"><CloseCircle size={12} color="#8C8C8C" /> Inactive</span>;
};

const RoleBadge = ({ role }: { role: string }) => {
  const isBursar = role.toUpperCase() === "BURSAR";
  return (
    <span
      className={
        isBursar
          ? "inline-flex rounded-full bg-indigo500/10 px-2.5 py-1 text-xs font-medium text-indigo500"
          : "inline-flex rounded-full bg-azure500/10 px-2.5 py-1 text-xs font-medium text-azure500"
      }
    >
      {isBursar ? "Bursar" : "Staff"}
    </span>
  );
};

export const StaffManagement = () => {
  const [showInvite, setShowInvite] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const { data, isLoading } = useStaffList(1, 100);
  const deleteMutation = useDeleteStaff();
  const resendMutation = useResendStaffInvite();

  const staff = data?.staff ?? [];
  const term = searchTerm.trim().toLowerCase();

  const filtered = staff.filter((m) => {
    if (statusFilter && m.status !== statusFilter) return false;
    if (roleFilter && m.role.toUpperCase() !== roleFilter) return false;
    if (term) {
      const haystack = `${m.name} ${m.email ?? ""} ${m.phone ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const handleRemove = (member: StaffMember) => {
    if (window.confirm(`Remove ${member.name} from staff?`)) {
      deleteMutation.mutate(member.id);
    }
  };

  const handleResend = (member: StaffMember) => {
    resendMutation.mutate(member.id);
  };

  return (
    <div className="w-full px-6 py-8">
      <PageHeader
        title="Non-Teaching Staff"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, email or phone"
        hint={
          <HelpHint
            title="Non-Teaching Staff"
            storageKey="staff"
            description="Manage the non-teaching team at your school."
            sections={[
              { title: "Roles", text: "Staff are general team members. Bursars get access to Finance to confirm and record payments." },
              { title: "Invites", text: "Invite by email or share a link. Team members accept and set their own password." },
            ]}
          />
        }
        filters={
          staff.length > 0 ? (
            <>
              <SelectDropdown options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} className="w-[150px]" />
              <SelectDropdown options={ROLE_OPTIONS} value={roleFilter} onChange={setRoleFilter} className="w-[150px]" />
            </>
          ) : undefined
        }
        actions={
          <Button onClick={() => setShowInvite(true)}>
            <Add size={16} color="#FFFFFF" />
            Invite Staff
          </Button>
        }
      />

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray100 p-10 text-center">
          <p className="text-sm text-gray500">Loading staff...</p>
        </div>
      ) : staff.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={30} color="#0D0D0D" />}
          title="No staff yet"
          description="Invite your first non-teaching team member. Bursars can confirm school fee payments."
          actionLabel="Invite Staff"
          onAction={() => setShowInvite(true)}
        />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray100 p-10 text-center">
          <p className="text-sm text-gray500">No staff match your search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray100 text-left text-xs text-gray500">
                  <th className="px-5 py-3.5 font-medium">Name</th>
                  <th className="px-5 py-3.5 font-medium">Contact</th>
                  <th className="px-5 py-3.5 font-medium">Role</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member.id} className="border-b border-gray50 hover:bg-pureWhite transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} size={36} />
                        <div>
                          <p className="font-medium text-gray900">{member.name}</p>
                          {member.designation && <p className="text-xs text-gray500">{member.designation}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray500">
                      <p>{member.email}</p>
                      {member.phone && <p className="text-xs">{member.phone}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {member.status === "INVITED" && (
                          <button
                            type="button"
                            onClick={() => handleResend(member)}
                            disabled={resendMutation.isPending}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray700 hover:bg-gray50 transition-colors disabled:opacity-50"
                          >
                            Resend
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemove(member)}
                          disabled={deleteMutation.isPending}
                          aria-label={`Remove ${member.name}`}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray500 hover:bg-red500/10 hover:text-red500 transition-colors disabled:opacity-50"
                        >
                          <Trash size={16} color="currentColor" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InviteStaffModal open={showInvite} onClose={() => setShowInvite(false)} />
    </div>
  );
};