import { useNavigate } from "react-router";
import { Profile2User, ArrowRight2 } from "iconsax-react";
import { useTeacherProfile } from "../../teacher/api";
import { useActiveTerm } from "../../calendar/api";
import { termLabel } from "../../calendar/utils/term";
import { useStudents } from "../../students/api";
import { Avatar } from "../../../components/ui/Avatar";
import { EmptyState } from "../../../components/ui/EmptyState";
import { HelpHint } from "../../../components/ui/HelpHint";
export const MyClassStudents = () => {
  const navigate = useNavigate();
  const { formClassId, formClass, schoolName, isLoading: profileLoading } = useTeacherProfile();
  const { activeTerm } = useActiveTerm();
  const { data: students, isLoading: studentsLoading, error } = useStudents(formClassId ?? "", "ACTIVE");
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));
  if (profileLoading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
        </div>
      </div>
    );
  }
  if (!formClassId) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="bg-white rounded-xl border border-gray100 p-12 text-center">
          <Profile2User size={32} className="mx-auto text-gray300 mb-3" variant="Bold" />
          <p className="text-sm font-medium text-gray900">You're not assigned as a form teacher</p>
          <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
            Once you're assigned a form class, you'll be able to view and review your students' reports here.
          </p>
        </div>
      </div>
    );
  }
  const term = activeTerm?.term ?? "";
  const subtitle = [schoolName, formClass, term ? termLabel(term).label : ""].filter(Boolean).join(" · ");
  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="group flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-gray900">My Class</h1>
            <HelpHint
              title="My Class"
              storageKey="my-class"
              description="The students in your class, ready for scoring."
              sections={[
                { title: "Your roster", text: "Every student in your class is listed here, with your class name shown below the title." },
                { title: "Open a student", text: "Tap a student to score or review their CA and exam results." },
              ]}
            />
          </div>
          <p className="text-xs md:text-sm text-gray500 mt-0.5">{subtitle || formClass}</p>
        </div>
        <p className="text-xs text-gray400">
          {sortedStudents.length} student{sortedStudents.length === 1 ? "" : "s"}
        </p>
      </div>
      {studentsLoading ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
        </div>
      ) : error ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-12 text-center">
          <p className="text-sm font-medium text-gray900">Couldn't load your students</p>
          <p className="text-xs text-gray500 mt-1">{(error as any)?.response?.data?.message ?? error.message}</p>
        </div>
      ) : sortedStudents.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            className="min-h-[280px] border border-gray100 rounded-xl"
            icon={<Profile2User size={30} variant="Bold" color="#0D0D0D" />}
            title="No students yet"
            description={`Students added to ${formClass} will appear here for you to review their reports.`}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedStudents.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/teach/ca-and-exams/reports/${s.id}`)}
              className="group flex items-center gap-3 rounded-xl border border-gray100 bg-white p-4 text-left transition-colors hover:border-gray300 hover:bg-gray50"
            >
              <Avatar name={s.name} size={44} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray900">{s.name}</p>
                <p className="truncate text-xs text-gray500">{s.admissionNo || "—"}</p>
              </div>
              <ArrowRight2 size={16} className="shrink-0 text-gray300 transition-colors group-hover:text-gray900" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
