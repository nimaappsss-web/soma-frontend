import { useNavigate, useParams } from "react-router";
import { ArrowLeft2, Profile2User, ArrowRight2 } from "iconsax-react";

import { SomaLoader } from "../../components/ui/SomaLoader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Avatar } from "../../components/ui/Avatar";
import { HelpHint } from "../../components/ui/HelpHint";
import { useClassDetail } from "../../features/principal/api/useClassDetail";
import { useStudents } from "../../features/students/api";
import { termLabel } from "../../features/calendar/utils/term";
import { useActiveTerm } from "../../features/calendar/api/useActiveTerm";

/**
 * Principal-facing roster for a class submitted for exam-sheet approval —
 * the counterpart of the form teacher's "My Class" screen. Clicking a student
 * opens their report card from the principal's point of view.
 */
export const AdminApprovalClass = () => {
  const { classId = "" } = useParams();
  const navigate = useNavigate();
  const { activeTerm } = useActiveTerm();
  const { data: classDetail, isLoading: classLoading } = useClassDetail(classId);
  const {
    data: students,
    isLoading: studentsLoading,
    error,
  } = useStudents(classId, "ACTIVE");

  const sortedStudents = [...(students ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const className = classDetail?.class?.name ?? "";
  const subtitle = [className, activeTerm ? `${termLabel(activeTerm.term).label}` : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
        >
          <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray900 truncate">
          {className || "Class"}
        </h1>
        <HelpHint
          title="Submitted class"
          storageKey="approval-class"
          description="The students in a class whose exam sheet is awaiting your approval."
          sections={[
            { title: "Review before approving", text: "Open any student to see their full report card exactly as parents will see it." },
            { title: "Back", text: "Use the arrow to return to the previous page." },
          ]}
        />
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs md:text-sm text-gray500">{subtitle}</p>
        <p className="text-xs text-gray400">
          {sortedStudents.length} student{sortedStudents.length === 1 ? "" : "s"}
        </p>
      </div>

      {classLoading || studentsLoading ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-8 text-center">
          <SomaLoader label="Loading students" className="h-8 w-8 mx-auto" />
        </div>
      ) : error ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-12 text-center">
          <p className="text-sm font-medium text-gray900">Couldn't load this class</p>
          <p className="text-xs text-gray500 mt-1">
            {(error as { response?: { data?: { message?: string } }; message?: string })
              ?.response?.data?.message ?? (error as Error)?.message}
          </p>
        </div>
      ) : sortedStudents.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            className="min-h-[280px] border border-gray100 rounded-xl"
            icon={<Profile2User size={30} variant="Bold" color="#0D0D0D" />}
            title="No students yet"
            description={`Students added to ${className} will appear here.`}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedStudents.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/admin/reports/${s.id}`)}
              className="group flex items-center gap-3 rounded-xl border border-gray100 bg-white p-4 text-left transition-colors hover:border-gray300 hover:bg-gray50"
            >
              <Avatar name={s.name} size={44} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray900">{s.name}</p>
                <p className="truncate text-xs text-gray500">{s.admissionNo || "—"}</p>
              </div>
              <ArrowRight2
                size={16}
                color="#B3B3B3"
                className="shrink-0 transition-colors group-hover:text-gray900"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
