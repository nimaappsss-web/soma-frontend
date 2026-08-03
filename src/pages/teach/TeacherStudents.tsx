import { Avatar } from "../../components/ui/Avatar";
import { useTeacherProfile } from "../../features/teacher/api";
import { useStudents } from "../../features/students/api";
import { useAuth } from "../../contexts/AuthContext";

export const TeacherStudents = () => {
  const { user } = useAuth();
  const { formClass, formClassId, isLoading: profileLoading } = useTeacherProfile();
  const { data: students, isLoading: studentsLoading } = useStudents(formClassId ?? "", "ACTIVE", undefined, user?.schoolId);

  if (profileLoading) {
    return <p className="text-sm text-gray-400 p-8">Loading...</p>;
  }

  if (!formClassId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">You are not a class teacher.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{formClass}</h2>
        <p className="text-sm text-gray-400 mt-1">
          {students.length} student{students.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {studentsLoading && students.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">Loading...</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">
            No students in this class.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {students.map((s) => (
              <div
                key={s.id}
                className="px-6 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar name={s.name} size={32} />
                  <div className="min-w-0">
                    <span className="text-gray-800 font-medium">{s.name}</span>
                    {s.admissionNo && (
                      <span className="ml-2 text-xs text-gray-400">
                        {s.admissionNo}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {s.gender ?? "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
