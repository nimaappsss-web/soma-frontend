import type { SubjectAssignment } from "../types";

interface SubjectAssignmentsCardProps {
  assignments: SubjectAssignment[];
}

export const SubjectAssignmentsCard = ({
  assignments,
}: SubjectAssignmentsCardProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-4">My Subjects</h3>
      {assignments.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="py-3 flex items-center justify-between"
            >
              <span className="text-gray-800 font-medium">
                {a.subject.name}
              </span>
              <span className="text-sm text-gray-500">
                {a.classes.map((c) => c.name).join(", ")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No subject assignments yet.</p>
      )}
    </div>
  );
};
