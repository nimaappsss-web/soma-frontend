import { Link, useParams } from "react-router";
import { ArrowLeft2, Book1 } from "iconsax-react";

import { useTeacherProfile } from "../../features/teacher/api";
import { SomaLoader } from "../../components/ui/SomaLoader";

export const SubjectDetail = () => {
  const { subjectId } = useParams();
  const { assignments, isLoading } = useTeacherProfile();

  const assignment = assignments.find((a) => a.subject.id === subjectId);
  const subject = assignment?.subject;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <SomaLoader label="Loading subject..." />
      </div>
    );
  }

  if (!assignment || !subject) {
    return (
      <div className="p-4 md:p-6 w-full">
        <Link
          to="/teach/subjects"
          className="inline-flex items-center gap-1.5 text-sm text-gray500 hover:text-gray900"
        >
          <ArrowLeft2 size={16} color="#8C8C8C" /> Subjects
        </Link>
        <div className="mt-6 flex flex-col items-center rounded-xl border border-gray100 bg-white p-10 text-center">
          <p className="font-semibold text-gray900">Subject not found</p>
          <p className="mt-1 text-sm text-gray500">
            This subject is no longer assigned to you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full">
      <Link
        to="/teach/subjects"
        className="inline-flex items-center gap-1.5 text-sm text-gray500 hover:text-gray900"
      >
        <ArrowLeft2 size={16} color="#8C8C8C" /> Subjects
      </Link>

      <div className="mt-4 rounded-2xl bg-gray900 p-5 md:p-6 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Book1 size={24} color="#FFFFFF" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{subject.name}</h1>
            {subject.code && <p className="text-sm text-white/60">{subject.code}</p>}
          </div>
        </div>
        {assignment.classes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {assignment.classes.map((c) => (
              <span key={c.id} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/90">
                {c.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};