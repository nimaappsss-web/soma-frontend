import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft2, Book1, Building, Calendar, Call, CloseCircle, Edit2, Message, Profile2User, TickCircle } from "iconsax-react";

import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/button";
import { useTeacherDetail, useSetTeacherApproval } from "../../features/teacher/api";
import { EditTeacherForm } from "../../features/teacher/components/EditTeacherForm";
import { cn } from "../../lib/utils";

const roleLabel = (role?: string) => (role ? role.replace(/_/g, " ") : "Teacher");

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray100 text-gray500">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-gray900">{value}</p>
    </div>
  </div>
);

export const AdminTeacherDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: teacher, isLoading, error } = useTeacherDetail(id ?? "");
  const approvalMutation = useSetTeacherApproval();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex items-center justify-center py-24 text-sm text-gray400">Loading...</div>
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
          <p className="mt-1 text-xs text-gray400">{error?.message ?? "The teacher may not exist or the network is offline."}</p>
        </div>
      </div>
    );
  }

  const formClass = teacher.formClass;

  return (
    <div className="p-4 md:p-6 w-full">
      <Link
        to="/admin/teachers"
        aria-label="Back to Teachers"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
      >
        <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
      </Link>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5 flex flex-wrap items-center gap-4">
        <Avatar name={teacher.name} imageUrl={teacher.profilePictureUrl} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-gray900">{teacher.name}</h1>
          <p className="mt-0.5 truncate text-sm text-gray400">{teacher.email}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
              <Edit2 size={14} color="#0D0D0D" />
              {editing ? "Close Editing" : "Edit Teacher"}
            </Button>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full bg-gray100 px-2.5 py-0.5 text-[11px] font-medium text-gray700 capitalize">
              {roleLabel(teacher.role)}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
                teacher.active === false ? "bg-amber500/10 text-amber500" : "bg-springgreen600/10 text-springgreen600",
              )}
            >
              {teacher.active === false ? "Inactive" : "Active"}
            </span>
            {teacher.approvalStatus === "PENDING" && (
              <span className="rounded-full bg-amber500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber500">
                Pending Approval
              </span>
            )}
            {teacher.approvalStatus === "REJECTED" && (
              <span className="rounded-full bg-red500/10 px-2.5 py-0.5 text-[11px] font-medium text-red500">
                Rejected
              </span>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">Edit Teacher — {teacher.name}</h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Close
            </Button>
          </div>
          <EditTeacherForm teacherId={teacher.id} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
        </div>
      )}

      <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-sm text-gray400 mb-3">Manage account access</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="success"
            disabled={approvalMutation.isPending}
            onClick={() => approvalMutation.mutate({ id: teacher.id, status: "APPROVED" })}
          >
            <TickCircle size={16} color="#FFFFFF" />
            {approvalMutation.isPending ? "Saving..." : "Approve Teacher"}
          </Button>
          <Button
            variant="destructive"
            disabled={approvalMutation.isPending}
            onClick={() => approvalMutation.mutate({ id: teacher.id, status: "REJECTED" })}
          >
            <CloseCircle size={16} color="#FFFFFF" />
            Reject Teacher
          </Button>
        </div>
        <p className="mt-3 text-xs text-gray400">
          Approved teachers can access the school's teaching dashboard. Rejected teachers lose access.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray100 p-5">
          <h2 className="text-sm font-semibold text-gray900 mb-4">Contact &amp; Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem icon={<Call size={16} color="#8C8C8C" />} label="Phone" value={teacher.phone ?? "—"} />
            <InfoItem icon={<Message size={16} color="#8C8C8C" />} label="Email" value={teacher.email ?? "—"} />
            <InfoItem icon={<Profile2User size={16} color="#8C8C8C" />} label="Role" value={roleLabel(teacher.role)} />
            <InfoItem icon={<Calendar size={16} color="#8C8C8C" />} label="Joined" value={formatDate(teacher.createdAt)} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray100 p-5">
          <h2 className="text-sm font-semibold text-gray900 mb-4">Class Teacher</h2>
          {formClass ? (
            <div className="flex items-center gap-3 rounded-lg border border-gray100 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray100 text-gray500">
                <Building size={16} color="#8C8C8C" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray900">{formClass.name}</p>
                <p className="text-xs text-gray400">
                  {formClass.level}
                  {formClass.arm ? ` · Arm ${formClass.arm}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray400">Not assigned to any form class.</p>
          )}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
        <h2 className="text-sm font-semibold text-gray900 mb-4">Subjects Taught</h2>
        {teacher.assignments.length === 0 ? (
          <p className="text-sm text-gray400">No subjects assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {teacher.assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray100 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray100 text-gray500">
                    <Book1 size={16} color="#8C8C8C" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray900">{a.subject.name}</p>
                    {a.subject.code && <p className="text-xs text-gray400">{a.subject.code}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 shrink-0 max-w-[55%]">
                  {a.classes.length === 0 ? (
                    <span className="text-xs text-gray400">No classes</span>
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