import { Book1 } from "iconsax-react";

import type { SubjectAssignment } from "../types";

interface SubjectAssignmentsCardProps {
  assignments: SubjectAssignment[];
}

export const SubjectAssignmentsCard = ({
  assignments,
}: SubjectAssignmentsCardProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray100 p-5">
      <h3 className="text-sm font-semibold text-gray900 mb-4">My Subjects</h3>
      {assignments.length > 0 ? (
        <div className="divide-y divide-gray50">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-offWhite text-gray500">
                  <Book1 size={14} color="#8C8C8C" />
                </span>
                <span className="truncate text-sm font-medium text-gray900">
                  {a.subject.name}
                </span>
              </div>
              <span className="truncate text-xs text-gray500">
                {a.classes.map((c) => c.name).join(", ")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray500">No subject assignments yet.</p>
      )}
    </div>
  );
};
