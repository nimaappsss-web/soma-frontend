import { Link } from "react-router";
import { ArrowRight, Building, Teacher } from "iconsax-react";

import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
} from "../../../components/ui/dialog";
import { schoolTypeLabel } from "../../../utils/schoolType";

export interface ClassDetailTarget {
  id: string;
  name: string;
  level: string;
  arm?: string;
  schoolType?: string;
  studentCount?: number;
  formTeacher?: { id: string; name: string; email?: string; phone?: string } | null;
}

interface ClassDetailModalProps {
  open: boolean;
  classRecord: ClassDetailTarget | null;
  deleting?: boolean;
  assignedSubjectIds?: string[];
  subjectName?: (id: string) => string;
  onAssign?: (classId: string) => void;
  detailHref?: string;
  onClose: () => void;
  onEdit?: (classRecord: ClassDetailTarget) => void;
  onDelete?: (id: string) => void;
}

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-gray400">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-gray900">{value}</p>
  </div>
);

export const ClassDetailModal = ({
  open,
  classRecord,
  deleting,
  assignedSubjectIds,
  subjectName,
  onAssign,
  detailHref,
  onClose,
  onEdit,
  onDelete,
}: ClassDetailModalProps) => {
  const ids = assignedSubjectIds ?? [];
  const formTeacher = classRecord?.formTeacher;
  const hasFooter = !!classRecord && (!!onEdit || !!onDelete);
  const isLastSection = !hasFooter && !detailHref;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent variant="center">
        <div className="p-6 pb-0">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray900 text-white">
              <Building size={26} color="#FFFFFF" variant="Bold" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-gray900">{classRecord?.name}</h2>
                {classRecord?.schoolType && (
                  <span className="shrink-0 rounded-full bg-gray100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray600">
                    {schoolTypeLabel(classRecord.schoolType)}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-gray400">
                {classRecord?.level}
                {classRecord?.arm ? ` · Arm ${classRecord.arm}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray100 p-4">
            <InfoItem
              label="Students"
              value={`${classRecord?.studentCount ?? 0} ${classRecord?.studentCount === 1 ? "student" : "students"}`}
            />
            <InfoItem label="Level" value={classRecord?.level ?? "—"} />
          </div>
        </div>

        {formTeacher && (
          <div className="px-6 pt-5">
            <h3 className="text-sm font-semibold text-gray900">Class Teacher</h3>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray100 px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray100 text-gray500">
                <Teacher size={16} color="#8C8C8C" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray900">{formTeacher.name}</p>
                {formTeacher.email && (
                  <p className="truncate text-xs text-gray400">{formTeacher.email}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {ids.length > 0 || onAssign ? (
          <div className={`px-6 pt-5${isLastSection ? " pb-6" : ""}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray900">Assigned Subjects</h3>
              <span className="text-xs text-gray400 tabular-nums">
                {ids.length} {ids.length === 1 ? "subject" : "subjects"}
              </span>
            </div>
            <div className="mt-3">
              {ids.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {ids.map((id) => (
                    <span
                      key={id}
                      className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600"
                    >
                      {subjectName ? subjectName(id) : id}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-blue-500">No subjects assigned to this class yet.</p>
              )}
              {onAssign && classRecord && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => onAssign(classRecord.id)}
                >
                  Assign / Edit subjects
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {detailHref && (
          <Link
            to={detailHref}
            className="mx-6 mt-5 flex items-center justify-between rounded-xl border border-gray100 px-4 py-3 text-sm font-medium text-gray900 transition-colors hover:border-gray200"
          >
            View full class details
            <ArrowRight size={16} color="#8C8C8C" />
          </Link>
        )}

        {classRecord && (onEdit || onDelete) && (
          <div className="flex gap-3 p-6">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(classRecord)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-red-500 hover:text-red-600"
                disabled={deleting}
                onClick={() => onDelete(classRecord.id)}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};