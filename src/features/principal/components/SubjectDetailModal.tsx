import { Book1, Teacher } from "iconsax-react";

import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
} from "../../../components/ui/dialog";
import type { Subject } from "../api/useSubjects";

export interface SubjectDetailTarget {
  id: string;
  name: string;
  code?: string;
  teachers?: Subject["teachers"];
}

interface SubjectDetailModalProps {
  open: boolean;
  subject: SubjectDetailTarget | null;
  deleting?: boolean;
  onClose: () => void;
  onEdit: (subject: SubjectDetailTarget) => void;
  onDelete: (id: string) => void;
}

export const SubjectDetailModal = ({
  open,
  subject,
  deleting,
  onClose,
  onEdit,
  onDelete,
}: SubjectDetailModalProps) => {
  const teachers = subject?.teachers ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent variant="center">
        <div className="p-6 pb-0">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray900 text-white">
              <Book1 size={26} color="#FFFFFF" variant="Bold" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray900">{subject?.name ?? "Subject"}</h2>
              <p className="mt-0.5 truncate text-sm text-gray400">
                {subject?.code ? `Code · ${subject.code}` : "No code set"}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray900">Teachers</h3>
            <span className="text-xs text-gray400 tabular-nums">
              {teachers.length} {teachers.length === 1 ? "teacher" : "teachers"}
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {teachers.length === 0 ? (
              <div className="rounded-lg border border-gray100 bg-offWhite/60 px-4 py-3 text-sm text-gray400">
                No teachers assigned to this subject yet.
              </div>
            ) : (
              teachers.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-gray100 px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray100 text-gray500">
                      <Teacher size={14} color="#8C8C8C" />
                    </span>
                    <p className="truncate text-sm font-medium text-gray900">{t.name}</p>
                  </div>
                  {t.classes && t.classes.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {t.classes.map((c) => (
                        <span
                          key={c.id}
                          className="whitespace-nowrap rounded-full bg-offWhite px-2.5 py-1 text-xs text-gray600"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6">
          {subject && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(subject)}
            >
              Edit
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-red-500 hover:text-red-600"
            disabled={deleting || !subject}
            onClick={() => subject && onDelete(subject.id)}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};