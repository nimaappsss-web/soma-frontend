import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { WarningBanner } from "../../../components/others/WarningBanner";
import { createSubjectSchema, type CreateSubjectFormData } from "../utils/validationSchema";
import { namesMatch } from "../../../utils/dedupe";
import type { Subject } from "../api/useSubjects";

export interface SubjectFormValues {
  name: string;
  code?: string;
}

export interface SubjectEditTarget {
  id: string;
  name: string;
  code?: string;
}

interface SubjectFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  editing: SubjectEditTarget | null;
  subjects: Subject[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: SubjectFormValues) => void;
}

export const SubjectFormModal = ({
  open,
  mode,
  editing,
  subjects,
  saving,
  onClose,
  onSubmit,
}: SubjectFormModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<CreateSubjectFormData>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: "", code: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editing) {
      reset({ name: editing.name, code: editing.code ?? "" });
    } else {
      reset({ name: "", code: "" });
    }
  }, [open, mode, editing, reset]);

  const watchedName = watch("name");
  const duplicateSubject = useMemo(() => {
    const name = (watchedName ?? "").trim();
    if (!name) return null;
    const list =
      mode === "edit" && editing
        ? subjects.filter((s) => s.id !== editing.id)
        : subjects;
    return list.find((s) => namesMatch(s.name, name)) ?? null;
  }, [watchedName, subjects, mode, editing]);

  const handleFormSubmit = (data: CreateSubjectFormData) => {
    onSubmit({ name: data.name, code: data.code || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent variant="center">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Subject" : "Add Subject"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the name or code for this subject."
              : "Add a new subject for your school."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 pb-6 space-y-4">
          {duplicateSubject && (
            <WarningBanner
              title={`A subject named "${duplicateSubject.name}" already exists.`}
              description="Choose a different name to create a new subject."
            />
          )}
          <div>
            <Label>Subject name</Label>
            <Input {...register("name")} placeholder="Subject name" autoFocus={mode === "create"} />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Code (optional)</Label>
            <Input {...register("code")} placeholder="e.g. MTH" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving || !!duplicateSubject || (mode === "edit" && !isDirty)}
              className="flex-1"
            >
              {saving ? "Saving..." : mode === "edit" ? "Save" : "Add Subject"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};