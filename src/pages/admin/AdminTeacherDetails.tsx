import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft2, Book1, Building, Calendar, Call, Edit2, Message, Profile2User } from "iconsax-react";

import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/button";
import { SomaLoader } from "../../components/ui/SomaLoader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { WarningBanner } from "../../components/others/WarningBanner";
import { useTeacherDetail, useSetTeacherApproval, useSetTeacherActive } from "../../features/teacher/api";
import { EditTeacherForm } from "../../features/teacher/components/EditTeacherForm";
import { cn } from "../../lib/utils";

const roleLabel = (role?: string) => (role ? role.replace(/_/g, " ") : "Teacher");

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const InfoItem = ({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: string;
}) => (
  <div className="flex items-center gap-3">
    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]", tint)}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-gray900">{value}</p>
    </div>
  </div>
);

const teacherStatus = (teacher: {
  approvalStatus?: "APPROVED" | "PENDING" | "REJECTED";
  active?: boolean;
}): { label: string; className: string } => {
  if (teacher.approvalStatus === "PENDING")
    return { label: "Pending Approval", className: "bg-amber500/10 text-amber500" };
  if (teacher.approvalStatus === "REJECTED")
    return { label: "Rejected", className: "bg-red500/10 text-red500" };
  if (teacher.active === false)
    return { label: "Deactivated", className: "bg-amber500/10 text-amber500" };
  return { label: "Active", className: "bg-springgreen600/10 text-springgreen600" };
};

export const AdminTeacherDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: teacher, isLoading, error } = useTeacherDetail(id ?? "");
  const approvalMutation = useSetTeacherApproval();
  const activeMutation = useSetTeacherActive();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="py-24">
          <SomaLoader label="Loading teacher" className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-4 md:p-6 w-full">
        <Link
          to="/admin/teachers"
          aria-label="Back to Teachers"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
        >
          <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
        </Link>
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-10 text-center">
          <p className="text-sm text-gray500">Could not load this teacher.</p>
          <p className="mt-1 text-xs text-gray500">{error?.message ?? "The teacher may not exist or the network is offline."}</p>
        </div>
      </div>
    );
  }

  const formClass = teacher.formClass;
  const status = teacherStatus(teacher);

  return (
    <div className="p-4 md:p-6 w-full">
      <Link
        to="/admin/teachers"
        aria-label="Back to Teachers"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
      >
        <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
      </Link>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar name={teacher.name} imageUrl={teacher.profilePictureUrl} size={60} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-gray900 truncate">{teacher.name}</h1>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
                    status.className,
                  )}
                >
                  {status.label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-gray500">{teacher.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray100 px-2.5 py-0.5 text-[11px] font-medium text-gray700 capitalize">
                  {roleLabel(teacher.role)}
                </span>
                {formClass && (
                  <span className="rounded-full bg-gray100 px-2.5 py-0.5 text-[11px] font-medium text-gray700">
                    {formClass.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 sm:ml-auto">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Edit2 size={14} color="#0D0D0D" />
              Edit Teacher
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={(open) => !open && setEditing(false)}>
        <DialogContent variant="middle" className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update {teacher.name}&apos;s profile, form class, and subject assignments.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <EditTeacherForm
              teacherId={teacher.id}
              onDone={() => setEditing(false)}
              onCancel={() => setEditing(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
        <h2 className="text-sm font-semibold text-gray900 mb-4">Manage account access</h2>

        {teacher.approvalStatus === "PENDING" && (
          <WarningBanner
            title="Awaiting your decision"
            description="This teacher has registered and is awaiting your decision. Rejecting also deactivates their account."
          >
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              <Button
                variant="success"
                disabled={approvalMutation.isPending}
                onClick={() => approvalMutation.mutate({ id: teacher.id, status: "APPROVED" })}
              >
                {approvalMutation.isPending ? "Saving..." : "Approve Teacher"}
              </Button>
              <Button
                variant="destructive"
                disabled={approvalMutation.isPending}
                onClick={() => approvalMutation.mutate({ id: teacher.id, status: "REJECTED" })}
              >
                Reject Teacher
              </Button>
            </div>
          </WarningBanner>
        )}

        {teacher.approvalStatus === "APPROVED" && teacher.active === true && (
          <WarningBanner
            title="Teacher is active"
            description="This teacher has access to the school's teaching dashboard. Deactivating temporarily blocks them from signing in."
          >
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              <Button
                variant="outline"
                disabled={activeMutation.isPending}
                onClick={() => activeMutation.mutate({ id: teacher.id, active: false })}
              >
                {activeMutation.isPending ? "Saving..." : "Deactivate Teacher"}
              </Button>
            </div>
          </WarningBanner>
        )}

        {teacher.active === false && (
          <WarningBanner
            title="You deactivated this teacher's account"
            description="Would you like to activate it?"
          >
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              <Button
                variant="success"
                disabled={activeMutation.isPending || approvalMutation.isPending}
                onClick={() => {
                  if (teacher.approvalStatus === "REJECTED") {
                    approvalMutation.mutate({ id: teacher.id, status: "APPROVED" });
                  } else {
                    activeMutation.mutate({ id: teacher.id, active: true });
                  }
                }}
              >
                {activeMutation.isPending || approvalMutation.isPending ? "Saving..." : "Activate Teacher"}
              </Button>
            </div>
          </WarningBanner>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray100 p-5">
          <h2 className="text-sm font-semibold text-gray900 mb-4">Contact &amp; Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <InfoItem
              icon={<Call size={18} color="#34A853" />}
              label="Phone"
              value={teacher.phone ?? "—"}
              tint="bg-springgreen600/10"
            />
            <InfoItem
              icon={<Message size={18} color="#4285F4" />}
              label="Email"
              value={teacher.email ?? "—"}
              tint="bg-azure500/10"
            />
            <InfoItem
              icon={<Profile2User size={18} color="#8C37C3" />}
              label="Role"
              value={roleLabel(teacher.role)}
              tint="bg-indigo500/10"
            />
            <InfoItem
              icon={<Calendar size={18} color="#FBBC05" />}
              label="Joined"
              value={formatDate(teacher.createdAt)}
              tint="bg-amber500/10"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray100 p-5">
          <h2 className="text-sm font-semibold text-gray900 mb-4">Class Teacher</h2>
          {formClass ? (
            <div className="flex items-center gap-3 rounded-xl border border-gray100 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-violet500/10">
                <Building size={18} color="#8B5CF6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray900">{formClass.name}</p>
                <p className="text-xs text-gray500">
                  {formClass.level}
                  {formClass.arm ? ` · Arm ${formClass.arm}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray500">Not assigned to any form class.</p>
          )}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
        <h2 className="text-sm font-semibold text-gray900 mb-4">Subjects Taught</h2>
        {teacher.assignments.length === 0 ? (
          <p className="text-sm text-gray500">No subjects assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {teacher.assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-gray100 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-azure500/10">
                    <Book1 size={18} color="#4285F4" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray900">{a.subject.name}</p>
                    {a.subject.code && (
                      <span className="shrink-0 rounded-md bg-gray100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-gray600">
                        {a.subject.code}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 shrink-0 max-w-[55%]">
                  {a.classes.length === 0 ? (
                    <span className="text-xs text-gray500">No classes</span>
                  ) : (
                    a.classes.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-gray100 px-2.5 py-0.5 text-[11px] font-medium text-gray600"
                      >
                        {c.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};