import { Link, useParams } from "react-router";
import { ArrowLeft2, ArrowRight, Building, Profile2User, Teacher } from "iconsax-react";

import { useClassDetail } from "../../features/principal/api";

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

export const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useClassDetail(id ?? "");
  const classRecord = data?.class;

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-center py-24 text-sm text-gray400">
          Loading...
        </div>
      </div>
    );
  }

  if (!classRecord) {
    return (
      <div className="p-6 max-w-3xl">
        <Link
          to="/admin/classes"
          aria-label="Back to Classes"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
        >
          <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
        </Link>
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-10 text-center">
          <p className="text-sm text-gray-500">Could not load this class.</p>
          <p className="mt-1 text-xs text-gray-400">
            {error?.message ?? "The class may not exist or the network is offline."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
<Link
        to="/admin/classes"
        aria-label="Back to Classes"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
      >
        <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
      </Link>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray900 text-white">
          <Building size={28} color="#FFFFFF" variant="Bold" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-gray-900">{classRecord.name}</h1>
          <p className="mt-0.5 truncate text-sm text-gray-400">
            {classRecord.level}
            {classRecord.arm ? ` · Arm ${classRecord.arm}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem
            icon={<Profile2User size={16} color="#8C8C8C" />}
            label="Students"
            value={`${classRecord.studentCount ?? 0} ${classRecord.studentCount === 1 ? "student" : "students"}`}
          />
          <InfoItem icon={<Building size={16} color="#8C8C8C" />} label="Level" value={classRecord.level} />
        </div>
        <Link
          to={`/admin/students?classId=${classRecord.id}`}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          View students in this class
          <ArrowRight size={16} color="#FFFFFF" />
        </Link>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Class Teacher</h2>
        {classRecord.formTeacher ? (
          <Link
            to={`/admin/teachers/${classRecord.formTeacher.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray100 px-4 py-3 hover:border-gray200 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray100 text-gray500">
                <Teacher size={16} color="#8C8C8C" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{classRecord.formTeacher.name}</p>
                {classRecord.formTeacher.email && (
                  <p className="truncate text-xs text-gray-400">{classRecord.formTeacher.email}</p>
                )}
              </div>
            </div>
            <ArrowRight size={16} color="#8C8C8C" className="shrink-0" />
          </Link>
        ) : (
          <p className="text-sm text-gray-400">No class teacher assigned yet.</p>
        )}
      </div>
    </div>
  );
};