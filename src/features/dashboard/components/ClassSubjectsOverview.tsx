import { Link } from "react-router";
import { ArrowRight, Bookmark } from "iconsax-react";

import { useClasses } from "../../principal/api";
import { useClassSubjects } from "../../class-subjects/api";

export const ClassSubjectsOverview = () => {
  const { data: classesData, isLoading } = useClasses();
  const { data: assignments } = useClassSubjects();

  const classes = classesData?.classes ?? [];
  const hasSubjects = (c: { id: string }) =>
    assignments?.some((a) => a.classId === c.id && a.subjectIds.length > 0) ?? false;

  const assigned = classes.filter(hasSubjects).length;
  const unassigned = classes.length - assigned;
  const pct = classes.length ? Math.round((assigned / classes.length) * 100) : 0;

  return (
    <Link
      to="/admin/subjects?tab=classes"
      className="mt-6 block w-full rounded-3xl border border-gray100 bg-white p-5 transition-colors hover:bg-gray50"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray900 text-white">
            <Bookmark size={18} color="#FFFFFF" variant="Bold" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray900">Subject assignment progress</p>
            <p className="mt-0.5 text-xs text-gray400">
              {isLoading
                ? "Loading..."
                : `${assigned} of ${classes.length} classes have subjects — ${unassigned} ${
                    unassigned === 1 ? "doesn't" : "don't"
                  } yet`}
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-3 md:w-1/2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray100">
            <div
              className="h-full rounded-full bg-gray900 transition-all duration-500"
              style={{ width: `${isLoading ? 0 : pct}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray900 tabular-nums">{isLoading ? "—" : `${pct}%`}</span>
          <span className="flex items-center gap-1 text-xs font-medium text-blue-500">
            Assign
            <ArrowRight size={14} color="#3B82F6" variant="Bold" />
          </span>
        </div>
      </div>
    </Link>
  );
};