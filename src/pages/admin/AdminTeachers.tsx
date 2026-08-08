import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight2, CloseCircle, TickCircle } from "iconsax-react";

import { Avatar } from "../../components/ui/Avatar";
import { CelebrationDecor } from "../../components/ui/CelebrationDecor";
import { Button } from "../../components/ui/button";
import { SelectDropdown, type SelectOption } from "../../components/ui/select-dropdown";
import { useTeachers, useResendInvite, useSetTeacherApproval } from "../../features/teacher/api";
import { useClasses } from "../../features/principal/api";
import { InviteTeacherModal } from "../../features/principal/components/InviteTeacherModal";
import { EditTeacherForm } from "../../features/teacher/components/EditTeacherForm";
import type { Teacher } from "../../features/teacher/types";
import { getCelebration, type Celebration } from "../../utils/celebrations";
import { PageHeader } from "../../components/ui/PageHeader";

type ViewMode = "list" | "grid";

const VIEW_STORAGE_KEY = "soma:admin:teachers-view";

const readView = (): ViewMode =>
  localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";

const teacherCelebration = (t: Teacher): Celebration | null =>
  getCelebration(t.dateOfBirth, "birthday") ??
  getCelebration(t.employmentDate, "anniversary");

const StatusBadge = ({ status }: { status?: Teacher["approvalStatus"] }) => {
  if (status === "PENDING")
    return <span className="ml-2 inline-block rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">Pending</span>;
  if (status === "REJECTED")
    return <span className="ml-2 inline-block rounded px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
  return null;
};

export const AdminTeachers = () => {
  const { data: teachersData, isLoading } = useTeachers();
  const { data: classesData } = useClasses();
  const navigate = useNavigate();
  const resendMutation = useResendInvite();
  const approvalMutation = useSetTeacherApproval();

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [view, setView] = useState<ViewMode>(readView);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const setViewMode = (next: ViewMode) => {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };

  const teachers = teachersData?.teachers ?? [];
  const pendingInvites = teachersData?.pendingInvites ?? [];

  const term = searchTerm.trim().toLowerCase();
  let filteredTeachers = term
    ? teachers.filter(
        (t) =>
          t.name.toLowerCase().includes(term) || t.email.toLowerCase().includes(term),
      )
    : [...teachers];
  if (sortOrder === "az" || sortOrder === "za") {
    const dir = sortOrder === "az" ? 1 : -1;
    filteredTeachers = [...filteredTeachers].sort((a, b) => a.name.localeCompare(b.name) * dir);
  }
  const filteredInvites =
    statusFilter === "active"
      ? []
      : term
        ? pendingInvites.filter((i) => i.email.toLowerCase().includes(term))
        : pendingInvites;

  const statusOptions: SelectOption[] = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
  ];
  const sortOptions: SelectOption[] = [
    { value: "", label: "Sort by" },
    { value: "az", label: "Sort by: A → Z" },
    { value: "za", label: "Sort by: Z → A" },
  ];

  const startEditing = (t: Teacher) => {
    setEditingTeacher(t);
    setShowInvite(false);
  };

  const stopEditing = () => setEditingTeacher(null);

  const formatExpiry = (seconds: number) => {
    if (seconds < 60) return "Expiring soon";
    const hours = Math.round(seconds / 3600);
    return `${hours}h remaining`;
  };

  return (
    <div className="p-4 md:p-6 w-full">
      <PageHeader
        title="Teachers"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search teacher"
        view={view}
        onViewChange={setViewMode}
        filters={
          <>
            <SelectDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Status"
              options={statusOptions}
              buttonClassName="h-[45px] text-sm"
              menuClassName="min-w-[180px]"
            />
            <SelectDropdown
              value={sortOrder}
              onChange={setSortOrder}
              placeholder="Sort by"
              options={sortOptions}
              buttonClassName="h-[45px] text-sm"
              menuClassName="min-w-[180px]"
            />
          </>
        }
        mobileFilters={
          <>
            <SelectDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Status"
              options={statusOptions}
              buttonClassName="h-10 text-sm"
              menuClassName="min-w-[200px]"
            />
            <SelectDropdown
              value={sortOrder}
              onChange={setSortOrder}
              placeholder="Sort by"
              options={sortOptions}
              buttonClassName="h-10 text-sm"
              menuClassName="min-w-[200px]"
            />
          </>
        }
        actions={
          <Button onClick={() => setShowInvite(true)}>
            + Invite Teacher
          </Button>
        }
      />

      <InviteTeacherModal open={showInvite} onClose={() => setShowInvite(false)} />

      {editingTeacher && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-800">Edit Teacher — {editingTeacher.name}</h3>
            <Button type="button" variant="ghost" size="sm" onClick={stopEditing}>
              Close
            </Button>
          </div>
          <EditTeacherForm teacherId={editingTeacher.id} onDone={stopEditing} onCancel={stopEditing} />
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-gray-500 p-8 text-center rounded-xl border border-gray100 bg-white">Loading...</p>
        ) : filteredTeachers.length === 0 && filteredInvites.length === 0 ? (
          <p className="text-sm text-gray-500 p-8 text-center rounded-xl border border-gray100 bg-white">No teachers yet.</p>
        ) : view === "grid" ? (
          <>
            {filteredInvites.length > 0 && (
              <div className="mb-4 rounded-xl border border-gray100 bg-white">
                {filteredInvites.map((invite) => (
                  <div key={invite.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-gray-400">—</span>
                      <span className="ml-3 text-gray-500">{invite.email}</span>
                      <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        Pending
                      </span>
                      <span className="ml-2 text-xs text-gray-400">{formatExpiry(invite.expiresIn)}</span>
                    </div>
                    <button
                      onClick={() => resendMutation.mutate(invite.id)}
                      disabled={resendMutation.isPending}
                      className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 underline"
                    >
                      {resendMutation.isPending ? "..." : "Resend"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filteredTeachers.map((t) => {
                const celeb = teacherCelebration(t);
                const className = t.formClass
                  ? classesData?.classes.find((c) => c.id === t.formClassId)?.name ?? t.formClass
                  : null;
                return (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/admin/teachers/${t.id}`)}
                    className="group relative overflow-hidden rounded-2xl border border-gray100 bg-gray50 p-6 pt-9 cursor-pointer transition-all hover:-translate-y-1 hover:border-gray300 hover:shadow-[0_22px_40px_-16px_rgba(0,0,0,0.24)]"
                  >
                    {celeb && <CelebrationDecor type={celeb.type} years={celeb.years} />}
                    <div className="absolute inset-x-0 top-0 h-[7.5rem] bg-gradient-to-b from-gray200 via-gray200/70 to-transparent" />
                    <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.08)_0%,transparent_70%)]" />
                    <div className="pointer-events-none absolute -bottom-16 -left-14 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.06)_0%,transparent_70%)]" />
                    <div className="absolute left-6 top-6 h-1 w-12 rounded-full bg-black/15" />
                    <div className="absolute right-6 top-6 h-7 w-7 rounded-full border-2 border-dashed border-black/20" />
                    <img
                      src="/icons/somawordmark_black.svg"
                      alt=""
                      className="pointer-events-none absolute -bottom-4 -right-4 w-40 opacity-[0.16]"
                    />
                    <div className="relative flex flex-col items-center pt-10">
                      <div className="relative">
                        <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-black/15 via-transparent to-black/5 blur-md" />
                        <Avatar
                          name={t.name}
                          size={84}
                          className="relative border-2 border-white shadow-[0_10px_24px_-8px_rgba(0,0,0,0.25)] ring-1 ring-black/5"
                        />
                      </div>
                      <p className="mt-4 w-full truncate text-center text-[15px] font-semibold text-gray900">
                        {t.name}
                      </p>
                      <p className="mt-1 w-full truncate text-center text-xs text-gray500">{t.email}</p>
                      {className && (
                        <span className="mt-2.5 inline-block rounded-full bg-gray100 px-3 py-1 text-[10px] font-medium text-gray600">
                          {className}
                        </span>
                      )}
                      <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-gray400 capitalize">
                        {t.role}
                      </span>
                      <StatusBadge status={t.approvalStatus} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray100">
            <div className="divide-y divide-gray-100">
            {filteredInvites.map((invite) => (
              <div key={invite.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <span className="text-gray-400">—</span>
                  <span className="ml-3 text-gray-500">{invite.email}</span>
                  <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                    Pending
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{formatExpiry(invite.expiresIn)}</span>
                </div>
                <button
                  onClick={() => resendMutation.mutate(invite.id)}
                  disabled={resendMutation.isPending}
                  className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 underline"
                >
                  {resendMutation.isPending ? "..." : "Resend"}
                </button>
              </div>
            ))}
            {filteredTeachers.map((t) => {
              const className = t.formClass
                ? classesData?.classes.find((c) => c.id === t.formClassId)?.name ?? t.formClass
                : null;
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/admin/teachers/${t.id}`)}
                  className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={t.name} size={32} />
                    <div className="min-w-0">
                      <span className="text-gray-800 font-medium">{t.name}</span>
                      <span className="ml-3 text-sm text-gray-400">{t.email}</span>
                      {className && (
                        <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {className}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-gray-400 capitalize">{t.role}</span>
                      <StatusBadge status={t.approvalStatus} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.approvalStatus !== "APPROVED" && (
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          approvalMutation.mutate({ id: t.id, status: "APPROVED" });
                        }}
                        disabled={approvalMutation.isPending}
                      >
                        <TickCircle size={14} color="#FFFFFF" />
                        Approve
                      </Button>
                    )}
                    {t.approvalStatus !== "REJECTED" && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          approvalMutation.mutate({ id: t.id, status: "REJECTED" });
                        }}
                        disabled={approvalMutation.isPending}
                      >
                        <CloseCircle size={14} color="#FFFFFF" />
                        Reject
                      </Button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(t);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Edit
                    </button>
                    <ArrowRight2 size={16} color="#BBBBBB" />
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </div>
    </div>
  );
};
