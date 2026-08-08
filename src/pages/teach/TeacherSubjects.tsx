import { useMemo } from "react";
import { Link } from "react-router";
import { Book, ArrowRight } from "iconsax-react";

import { useAuth } from "../../contexts/AuthContext";
import { useTeacherProfile } from "../../features/teacher/api";
import { useAllStudents } from "../../features/students/api";
import { SomaLoader } from "../../components/ui/SomaLoader";

export const TeacherSubjects = () => {
  const { user } = useAuth();
  const { assignments, schoolName, name, isLoading } = useTeacherProfile();
  const { data: students, isLoading: studentsLoading } = useAllStudents(user?.id ?? "");

  const countsByClass = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of students) {
      if (!s.classId) continue;
      counts.set(s.classId, (counts.get(s.classId) ?? 0) + 1);
    }
    return counts;
  }, [students]);

  const loading = isLoading || studentsLoading;
  const firstName = name?.split(" ")[0];
  const totalStudents = assignments.reduce(
    (sum, a) => sum + a.classes.reduce((acc, c) => acc + (countsByClass.get(c.id) ?? 0), 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <SomaLoader label="Loading your subjects..." />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-1">
        <p className="text-sm text-gray500">{schoolName}</p>
        <h1 className="text-2xl font-bold text-gray900 mt-0.5">
          My Subjects{firstName ? `, ${firstName}` : ""}
        </h1>
      </div>

      {assignments.length > 0 ? (
        <>
          <div className="mt-4 rounded-xl bg-gray900 px-5 py-4 text-white">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-medium text-white/50">Assigned Subjects</p>
                <p className="mt-0.5 text-lg font-semibold">{assignments.length}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-white/50">Students</p>
                <p className="mt-0.5 text-lg font-semibold">{totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((a) => {
              const studentCount = a.classes.reduce(
                (sum, c) => sum + (countsByClass.get(c.id) ?? 0),
                0,
              );
              return (
                <Link
                  key={a.subject.id}
                  to={`/teach/subjects/${a.subject.id}`}
                  className="group flex flex-col bg-white border border-gray100 rounded-xl p-5 transition-colors hover:border-gray-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-offWhite text-gray500">
                        <Book size={18} color="#8C8C8C" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray900">{a.subject.name}</p>
                        {a.subject.code && <p className="text-xs text-gray500">{a.subject.code}</p>}
                      </div>
                    </div>
                    <ArrowRight
                      size={18}
                      color="#8C8C8C"
                      className="shrink-0 text-gray400 group-hover:text-gray700 transition-colors"
                    />
                  </div>

                  {a.classes.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {a.classes.map((c) => (
                        <span
                          key={c.id}
                          className="whitespace-nowrap rounded-full bg-offWhite px-2.5 py-1 text-xs text-gray700"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray100 flex items-center gap-4 text-xs text-gray500">
                    <span>
                      {studentCount} student{studentCount === 1 ? "" : "s"}
                    </span>
                    <span>
                      {a.classes.length} class{a.classes.length === 1 ? "" : "es"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-5 flex flex-col items-center rounded-xl border border-gray100 bg-white p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-offWhite">
            <Book size={24} color="#8C8C8C" />
          </span>
          <p className="mt-4 font-semibold text-gray900">No subject assignments yet</p>
          <p className="mt-1 text-sm text-gray500">
            Once the principal assigns you subjects, they will show up here.
          </p>
        </div>
      )}
    </div>
  );
};