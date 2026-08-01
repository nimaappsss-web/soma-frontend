import { Link, useParams } from "react-router";
import { ArrowLeft2, Book1, Building, Calendar, Call, Message, Profile2User } from "iconsax-react";

import { Avatar } from "../../components/ui/Avatar";
import { useTeacherDetail } from "../../features/teacher/api";
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

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-center py-24 text-sm text-gray400">Loading...</div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-6 max-w-3xl">
        <Link
          to="/admin/teachers"
          className="inline-flex items-center gap-2 rounded-full border border-gray100 px-3 py-1.5 text-xs font-medium text-gray700 hover:border-gray200 hover:text-gray900 transition-colors"
        >
          <ArrowLeft2 size={14} color="#242425" /> Back to Teachers
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
    <div className="p-6 max-w-3xl">
      <Link
        to="/admin/teachers"
        className="inline-flex items-center gap-2 rounded-full border border-gray100 px-3 py-1.5 text-xs font-medium text-gray700 hover:border-gray200 hover:text-gray900 transition-colors"
      >
        <ArrowLeft2 size={14} /> Back to Teachers
      </Link>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5 flex items-center gap-4">
        <Avatar name={teacher.name} imageUrl={teacher.profilePictureUrl} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-gray900">{teacher.name}</h1>
          <p className="mt-0.5 truncate text-sm text-gray400">{teacher.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
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
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
        <h2 className="text-sm font-semibold text-gray900 mb-4">Contact &amp; Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem icon={<Call size={16} color="#8C8C8C" />} label="Phone" value={teacher.phone ?? "—"} />
          <InfoItem icon={<Message size={16} color="#8C8C8C" />} label="Email" value={teacher.email ?? "—"} />
          <InfoItem icon={<Profile2User size={16} color="#8C8C8C" />} label="Role" value={roleLabel(teacher.role)} />
          <InfoItem icon={<Calendar size={16} color="#8C8C8C" />} label="Joined" value={formatDate(teacher.createdAt)} />
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
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
