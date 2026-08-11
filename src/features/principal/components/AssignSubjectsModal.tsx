import { useEffect, useState } from "react";

import { Button } from "../../../components/ui/button";
import { MultiSelect } from "../../../components/ui/multi-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import type { Subject } from "../api/useSubjects";
import type { Class } from "../api/useClasses";
import type { ClassSubjectAssignment } from "../../class-subjects/types";

interface AssignSubjectsModalProps {
  open: boolean;
  classes: Class[];
  subjects: Subject[];
  assignments: ClassSubjectAssignment[];
  saving: boolean;
  initialClassIds?: string[];
  onClose: () => void;
  onSubmit: (classIds: string[], subjectIds: string[]) => void;
}

export const AssignSubjectsModal = ({
  open,
  classes,
  subjects,
  assignments,
  saving,
  initialClassIds,
  onClose,
  onSubmit,
}: AssignSubjectsModalProps) => {
  const [classIds, setClassIds] = useState<string[]>(initialClassIds ?? []);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setClassIds(initialClassIds ?? []);
    setSubjectIds(
      initialClassIds?.length === 1
        ? assignments.find((a) => a.classId === initialClassIds[0])?.subjectIds ?? []
        : [],
    );
    // Reset selection on each open; initialClassIds/assignments are captured at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const assignmentFor = (classId: string) => assignments.find((a) => a.classId === classId);
  const currentForSelected = classIds
    .map((id) => assignmentFor(id)?.subjectIds ?? [])
    .filter((ids) => ids.length > 0);
  const hasMixedSubjects =
    currentForSelected.length > 1 &&
    currentForSelected.some((ids) => ids.join() !== currentForSelected[0].join());

  const classOptions = classes.map((c) => {
    const count = assignmentFor(c.id)?.subjectIds.length ?? 0;
    return {
      value: c.id,
      label: count > 0 ? `${c.name} · ${count} ${count === 1 ? "subject" : "subjects"}` : `${c.name} · none`,
    };
  });

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));

  const handleClassChange = (ids: string[]) => {
    setClassIds(ids);
    if (ids.length === 1) {
      setSubjectIds(assignmentFor(ids[0])?.subjectIds ?? []);
    } else if (ids.length > 1) {
      setSubjectIds([]);
    }
  };

  const handleSubmit = () => {
    if (classIds.length === 0 || saving) return;
    onSubmit(classIds, subjectIds);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent variant="center">
        <DialogHeader>
          <DialogTitle>Assign subjects to classes</DialogTitle>
          <DialogDescription>
            Pick the classes first, then the subjects each of them should offer. A batch selection applies the same
            subject set to every class chosen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          <div className="space-y-1.5">
            <span className="text-xs text-gray500">Classes</span>
            <MultiSelect
              options={classOptions}
              selected={classIds}
              onChange={handleClassChange}
              placeholder="Select classes"
              searchable
              forcePortal
            />
            {hasMixedSubjects && (
              <p className="text-xs text-placeholder">
                Selected classes have different subject sets — choosing subjects here will replace them all.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-gray500">Subjects</span>
            <MultiSelect
              options={subjectOptions}
              selected={subjectIds}
              onChange={setSubjectIds}
              placeholder="Select subjects for the chosen classes"
              searchable
              forcePortal
            />
            {subjects.length === 0 && (
              <p className="text-xs text-placeholder">Add subjects first to assign them.</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving || classIds.length === 0}
              className="flex-1"
            >
              {saving ? "Saving..." : "Assign"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};