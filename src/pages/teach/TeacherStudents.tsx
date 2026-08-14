import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Profile2User } from "iconsax-react";
import { Avatar } from "../../components/ui/Avatar";
import { CelebrationDecor } from "../../components/ui/CelebrationDecor";
import { EmptyState } from "../../components/ui/EmptyState";
import { StudentPageHeader, type StudentViewMode } from "../../features/students/components/StudentPageHeader";
import { HelpHint } from "../../components/ui/HelpHint";
import { useTeacherProfile } from "../../features/teacher/api";
import { useStudents } from "../../features/students/api";
import { useAuth } from "../../contexts/AuthContext";
import { getCelebration } from "../../utils/celebrations";
type ViewMode = StudentViewMode;
const VIEW_STORAGE_KEY = "soma:teacher:students-view";
const readView = (): ViewMode =>
  localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";

const getLastName = (name: string) => name.trim().split(/\s+/).pop() ?? "";
const getFirstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export const TeacherStudents = () => {
  const { user } = useAuth();
  const { formClass, formClassId, isLoading: profileLoading } = useTeacherProfile();
  const { data: allStudents, isLoading: studentsLoading } = useStudents(formClassId ?? "", "ACTIVE", undefined, user?.schoolId);
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<ViewMode>(readView);
  const setViewMode = (next: ViewMode) => {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };

  const students = useMemo(() => {
    let result = allStudents;
    if (statusFilter) result = result.filter((s) => s.status === statusFilter);
    const term = searchTerm.trim().toLowerCase();
    if (term) result = result.filter((s) => s.name.toLowerCase().includes(term));
    const sorted = [...result];
    if (sortOrder === "az") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOrder === "za") sorted.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortOrder === "last-first") sorted.sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)));
    else if (sortOrder === "first-last") sorted.sort((a, b) => getFirstName(a.name).localeCompare(getFirstName(b.name)));
    return sorted;
  }, [allStudents, statusFilter, searchTerm, sortOrder]);

  if (profileLoading) {
    return <p className="text-sm text-gray-500 p-4 md:p-6">Loading...</p>;
  }
  if (!formClassId) {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-gray-500 mb-4">You are not a class teacher.</p>
      </div>
    );
  }
  const loading = studentsLoading && allStudents.length === 0;
  return (
    <div className="p-4 md:p-6 w-full">
      <StudentPageHeader
        title="Students"
        subtitle={formClass ? <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">{formClass}</span> : undefined}
        hint={
          <HelpHint
            title="Students"
            storageKey="teacher-students"
            description="The students in your assigned class."
            sections={[
              { title: "Your class", text: "This list shows students for the class you teach, highlighted next to the title." },
              { title: "Search & sort", text: "Use the search bar and filters to find a student by name or status." },
              { title: "Open a student", text: "Tap any student to view their profile, attendance, and academics." },
            ]}
          />
        }
        classOptions={[]}
        classValue={classFilter}
        onClassChange={setClassFilter}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        sortValue={sortOrder}
        onSortChange={setSortOrder}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        view={view}
        onViewChange={setViewMode}
      />
      {loading ? (
        <p className="text-sm text-gray-500 p-8 text-center">Loading...</p>
      ) : students.length === 0 ? (
        <EmptyState
          icon={<Profile2User size={30} variant="Bold" color="#0D0D0D" />}
          title="No students in this class"
          description="Students added to your class by the school will show up here."
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {students.map((s) => {
            const celeb = getCelebration(s.dateOfBirth, "birthday");
            return (
            <Link
              key={s.id}
              to={`/teach/students/${s.id}`}
              className="group relative overflow-hidden rounded-tl-3xl rounded-tr-[28px] rounded-br-3xl rounded-bl-[28px] border border-gray100 bg-white p-6 pt-9 transition-all hover:-translate-y-0.5 hover:border-gray300 hover:shadow-[0_16px_30px_-14px_rgba(0,0,0,0.18)]"
            >
              {celeb && <CelebrationDecor type={celeb.type} years={celeb.years} />}
              <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.06)_0%,transparent_70%)]" />
              <div className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.05)_0%,transparent_70%)]" />
              <img
                src="/icons/somawordmark_black.svg"
                alt=""
                className="pointer-events-none absolute -bottom-2 -right-3 w-28 opacity-[0.12] transition-opacity group-hover:opacity-20"
              />
              <div className="relative flex flex-col items-center pt-2">
                <div className="relative">
                  <div className="absolute -inset-2.5 rounded-full bg-gradient-to-br from-black/10 via-transparent to-black/5 blur-md" />
                  <Avatar
                    name={s.name}
                    size={72}
                    className="relative border-2 border-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.2)] ring-1 ring-black/5"
                  />
                </div>
                <p className="mt-5 w-full truncate text-center text-[15px] font-semibold text-gray900">
                  {s.name}
                </p>
                {s.admissionNo && (
                  <p className="mt-1 w-full truncate text-center text-xs text-gray500">
                    {s.admissionNo}
                  </p>
                )}
                <span className="mt-3 rounded-full bg-offWhite px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-gray500">
                  {s.gender ?? "—"}
                </span>
              </div>
            </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray100">
          <div className="divide-y divide-gray50">
            {students.map((s) => (
              <div
                key={s.id}
                className="px-4 md:px-6 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar name={s.name} size={32} />
                  <div className="min-w-0">
                    <Link
                      to={`/teach/students/${s.id}`}
                      className="font-medium text-gray900 hover:text-gray700"
                    >
                      {s.name}
                    </Link>
                    {s.admissionNo && (
                      <span className="ml-2 text-xs text-gray500">
                        {s.admissionNo}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray500">{s.gender ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};