import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import {
  ArrowLeft2,
  Book1,
  Call,
  Calendar,
  Clock,
  Edit,
  Location,
  Medal,
  Message,
  Profile2User,
  Ranking,
  StatusUp,
} from "iconsax-react";

import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/button";
import { SomaLoader } from "../components/ui/SomaLoader";
import { useStudentDetail, useStudentAcademics, useStudentMonthlyAttendance, useStudentTimeline, useUpdateStudent } from "../features/students/api";
import { useFailedStudentContact } from "../features/students/api/useFailedStudentContact";
import { StudentFormDialog } from "../features/students/components/StudentFormDialog";
import { SiblingBadge } from "../features/students/components/SiblingBadge";
import type { TimelineEvent } from "../features/students/types";
import type { UpdateStudentPayload } from "../features/students/types";
import { useClasses } from "../features/principal/api";
import { useActiveTerm } from "../features/calendar/api";
import { localDateKey } from "../utils/date";
import { cn } from "../lib/utils";

const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso.split("T")[0]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const STATUS_META: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-springgreen600/10 text-springgreen600" },
  TRANSFERRED: { label: "Transferred", className: "bg-blue-500/10 text-blue-600" },
  WITHDRAWN: { label: "Withdrawn", className: "bg-amber500/10 text-amber500" },
  GRADUATED: { label: "Graduated", className: "bg-gray-100 text-gray-600" },
};

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-xl border border-gray100 bg-white p-5">
    <div className="mb-5 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-offWhite text-gray500">
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-gray900">{title}</h2>
    </div>
    {children}
  </div>
);

const MetaField = ({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: string; className?: string }) => (
  <div className={cn("min-w-0", className)}>
    <div className="flex items-center gap-1.5">
      <span className="shrink-0 text-gray500">{icon}</span>
      <p className="text-xs font-medium text-gray500">{label}</p>
    </div>
    <p className="mt-1 truncate text-sm font-medium text-gray900">{value}</p>
  </div>
);

const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) => (
  <div className="rounded-xl border border-gray100 bg-white p-4">
    <div className="flex items-center gap-2 text-gray500">
      {icon}
      <p className="text-xs font-medium">{label}</p>
    </div>
    <p className="mt-2 text-2xl font-bold text-gray900">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-gray500">{sub}</p>}
  </div>
);

const TIMELINE_ICON: Record<string, React.ReactNode> = {
  ADMISSION: <Book1 size={16} color="#0D0D0D" />,
  PROMOTION: <StatusUp size={16} color="#0D0D0D" />,
  STATUS_CHANGE: <Profile2User size={16} color="#0D0D0D" />,
  CLASS_TRANSFER: <ArrowLeft2 size={16} color="#0D0D0D" />,
};

export const StudentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isTeacher = location.pathname.startsWith("/teach");
  const backTo = isTeacher ? "/teach/students" : "/admin/students";

  const goBack = () => navigate(backTo);

  const { data: student, isLoading } = useStudentDetail(id ?? "");
  const { data: classesData } = useClasses();
  const { activeTerm } = useActiveTerm();
  const now = new Date();
  const { academics } = useStudentAcademics({ studentId: id ?? "" });
  const { attendance } = useStudentMonthlyAttendance({
    studentId: id ?? "",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const { timeline: timelineData } = useStudentTimeline({ studentId: id ?? "" });
  const updateMutation = useUpdateStudent();
  const [editing, setEditing] = useState(false);
  const rejectedContact = useFailedStudentContact(id ?? "");

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="py-24">
          <SomaLoader label="Loading student" className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back to Students"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
        >
          <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
        </button>
        <div className="mt-4 rounded-xl border border-gray100 bg-white p-10 text-center">
          <p className="text-sm text-gray500">Could not load this student.</p>
        </div>
      </div>
    );
  }

  const className = classesData?.classes.find((c) => c.id === student.classId)?.name ?? "—";
  const statusMeta = STATUS_META[student.status] ?? STATUS_META.ACTIVE;
  const termLabel = activeTerm ? `${activeTerm.term} Term` : "Active term";
  const days = attendance?.days ?? [];

  const todayKey = localDateKey();
  const daysWithFuture = days.map((d) => {
    if (d.status === "absent" && d.date >= todayKey) {
      return { ...d, status: "future" as const };
    }
    return d;
  });

  return (
    <div className="p-4 md:p-6">
      <button
        type="button"
        onClick={goBack}
        aria-label="Back to Students"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
      >
        <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
      </button>

      <div className="mt-4 rounded-xl border border-gray100 bg-white p-5 flex flex-wrap items-center gap-4">
        <Avatar name={student.name} imageUrl={student.imageUrl} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-gray900">{student.name}</h1>
          <p className="mt-0.5 truncate text-sm text-gray500">
            {student.admissionNo ? `${student.admissionNo} · ` : ""}{className}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {!isTeacher && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="mb-1"
            >
              <Edit size={14} color="#0D0D0D" />
              Edit
            </Button>
          )}
          <span className="rounded-full bg-gray100 px-2.5 py-0.5 text-[11px] font-medium text-gray700 capitalize">
            Student
          </span>
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", statusMeta.className)}>
            {statusMeta.label}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard
          icon={<Calendar size={16} color="#8C8C8C" />}
          label="Attendance"
          value={attendance?.percentage !== undefined ? `${attendance.percentage}%` : "—"}
          sub={`${attendance?.present ?? 0}/${attendance?.schoolDays ?? 0} days this month`}
        />
        <StatCard
          icon={<Medal size={16} color="#8C8C8C" />}
          label="Term Average"
          value={academics?.average !== undefined ? `${academics.average}%` : "—"}
          sub={termLabel}
        />
        <StatCard
          icon={<Ranking size={16} color="#8C8C8C" />}
          label="Position"
          value={academics?.position !== undefined ? `#${academics.position}` : "—"}
          sub={academics?.classSize ? `of ${academics.classSize} students` : undefined}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard title="Profile" icon={<Profile2User size={16} color="#8C8C8C" />}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <MetaField icon={<Profile2User size={13} color="#8C8C8C" />} label="Gender" value={student.gender ?? "—"} />
            <MetaField icon={<Calendar size={13} color="#8C8C8C" />} label="Date of Birth" value={formatDate(student.dateOfBirth)} />
            <MetaField icon={<Book1 size={13} color="#8C8C8C" />} label="Admission No" value={student.admissionNo ?? "—"} />
            <MetaField icon={<StatusUp size={13} color="#8C8C8C" />} label="Class" value={className} />
            <MetaField className="col-span-2" icon={<Location size={13} color="#8C8C8C" />} label="Address" value={student.address ?? "—"} />
          </div>
        </InfoCard>

        <InfoCard title="Guardian" icon={<Profile2User size={16} color="#8C8C8C" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <MetaField icon={<Profile2User size={13} color="#8C8C8C" />} label="Parent / Guardian" value={student.parentName ?? "—"} />
            <MetaField icon={<Call size={13} color="#8C8C8C" />} label="Phone" value={student.parentPhone ?? "—"} />
            <MetaField className="sm:col-span-2" icon={<Message size={13} color="#8C8C8C" />} label="Email" value={student.parentEmail ?? "—"} />
            {rejectedContact && (
              <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-red-700">Parent contact wasn't accepted</p>
                <p className="text-xs text-red-600 mt-0.5">
                  This contact wasn't saved — it's already linked to an existing account. Edit the
                  student to use a different parent email or phone.
                </p>
              </div>
            )}
          </div>
        </InfoCard>
      </div>

      {student.parentEmail && (
        <SiblingBadge parentEmail={student.parentEmail} currentStudentId={student.id} />
      )}

      <div className="mt-4 rounded-xl border border-gray100 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray900 mb-4">Attendance — {now.toLocaleString("en-GB", { month: "long", year: "numeric" })}</h2>
        {days.length === 0 ? (
          <p className="text-sm text-gray500">No attendance recorded this month.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {daysWithFuture.map((d) => (
                <span
                  key={d.date}
                  title={d.date}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-medium",
                    d.status === "present" && "bg-springgreen600 text-white",
                    d.status === "absent" && "bg-red500 text-white",
                    d.status === "holiday" && "bg-gray100 text-gray500",
                    d.status === "future" && "bg-white text-gray500 border border-dashed border-gray200",
                  )}
                >
                  {Number(d.date.slice(8))}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-springgreen600" /> Present · {attendance?.present ?? 0}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red500" /> Absent · {attendance?.absent ?? 0}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gray100" /> Holiday
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-gray300 bg-white" /> Future
              </span>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-gray100 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray900">Academics</h2>
          <span className="rounded-full bg-gray100 px-2.5 py-0.5 text-[11px] font-medium text-gray600 capitalize">
            {termLabel}
          </span>
        </div>
        {!academics || academics.subjects.length === 0 ? (
          <p className="text-sm text-gray500">No scores recorded for the {termLabel.toLowerCase()}.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray100 text-left text-xs text-gray500">
                    <th className="py-2 pr-3 font-medium">Subject</th>
                    <th className="py-2 px-3 font-medium">CA</th>
                    <th className="py-2 px-3 font-medium">Exam</th>
                    <th className="py-2 px-3 font-medium">Total</th>
                    <th className="py-2 px-3 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {academics.subjects.map((s) => (
                    <tr key={s.subjectId} className="border-b border-gray50">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-gray900">{s.subjectName}</p>
                        <p className="text-xs text-gray500">{s.teacherName}</p>
                      </td>
                      <td className="py-2.5 px-3 text-gray600">{s.caTotal}</td>
                      <td className="py-2.5 px-3 text-gray600">{s.examScore}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray900">{s.total}</td>
                      <td className="py-2.5 px-3">
                        <span className="rounded-full bg-gray100 px-2 py-0.5 text-[11px] font-medium text-gray700">
                          {s.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {academics.bestSubject && academics.worstSubject && (
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray500">
                <span className="flex items-center gap-1.5">
                  <Medal size={14} color="#FBBC05" />
                  Best: <span className="font-medium text-gray900">{academics.bestSubject.name} ({academics.bestSubject.score})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <StatusUp size={14} color="#CD432F" />
                  Needs work: <span className="font-medium text-gray900">{academics.worstSubject.name} ({academics.worstSubject.score})</span>
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-gray100 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray900 mb-4">Timeline</h2>
        {(timelineData ?? []).length === 0 ? (
          <p className="text-sm text-gray500">No records yet.</p>
        ) : (
          <ol className="relative space-y-5 border-l border-gray100 pl-5">
            {(timelineData ?? []).map((e: TimelineEvent) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full bg-gray100 text-gray500 ring-4 ring-white">
                  {TIMELINE_ICON[e.type] ?? <Clock size={12} color="#0D0D0D" />}
                </span>
                <p className="text-sm font-medium text-gray900">{e.description}</p>
                <p className="mt-0.5 text-xs text-gray500">{formatDate(e.date)}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <StudentFormDialog
        open={editing}
        onOpenChange={setEditing}
        student={student}
        classes={(classesData?.classes ?? []).map((c) => ({ value: c.id, label: c.name }))}
        isSaving={updateMutation.isPending}
        onSubmit={(payload) =>
          updateMutation.mutate(
            { id: student.id, data: payload as UpdateStudentPayload },
            { onSuccess: () => setEditing(false) },
          )
        }
      />
    </div>
  );
};
