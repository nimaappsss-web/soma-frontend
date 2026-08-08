import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import {
  SelectDropdown,
  type SelectOption,
} from "../../../components/ui/select-dropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { WarningBanner } from "../../../components/others/WarningBanner";
import { createClassSchema, type CreateClassFormData } from "../utils/validationSchema";
import { namesMatch } from "../../../utils/dedupe";
import type { Class } from "../api/useClasses";

export interface ClassFormValues {
  name: string;
  level: string;
  arm?: string;
  schoolType?: string;
}

export interface ClassEditTarget {
  id: string;
  name: string;
  level: string;
  arm?: string;
  schoolType?: string;
}

interface ClassFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  editing: ClassEditTarget | null;
  classes: Class[];
  schoolTypeOptions: SelectOption[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: ClassFormValues) => void;
}

const buildName = (level: string, arm: string) => {
  const trimmedLevel = level.trim();
  const trimmedArm = arm.trim().toUpperCase();
  return trimmedArm ? `${trimmedLevel} ${trimmedArm}` : trimmedLevel;
};

export const ClassFormModal = ({
  open,
  mode,
  editing,
  classes,
  schoolTypeOptions,
  saving,
  onClose,
  onSubmit,
}: ClassFormModalProps) => {
  const [schoolType, setSchoolType] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: "", level: "", arm: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && editing) {
      reset({ name: editing.name, level: editing.level, arm: editing.arm ?? "" });
      setSchoolType(editing.schoolType ?? "");
    } else {
      reset({ name: "", level: "", arm: "" });
      setSchoolType("");
    }
  }, [open, mode, editing, reset]);

  const watchedLevel = watch("level");
  const watchedArm = watch("arm");

  const watchedName = useMemo(
    () => buildName(watchedLevel ?? "", watchedArm ?? ""),
    [watchedLevel, watchedArm],
  );
  const duplicateClass = useMemo(() => {
    const name = watchedName.trim();
    if (!name) return null;
    const list =
      mode === "edit" && editing
        ? classes.filter((c) => c.id !== editing.id)
        : classes;
    return list.find((c) => namesMatch(c.name, name)) ?? null;
  }, [watchedName, classes, mode, editing]);

  const handleFormSubmit = (data: CreateClassFormData) => {
    onSubmit({
      name: buildName(data.level, data.arm ?? ""),
      level: data.level,
      arm: data.arm || undefined,
      schoolType: mode === "create" ? schoolType || undefined : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent variant="center">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Class" : "Add Class"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the level or arms for this class."
              : "Add a new class for your school."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 pb-6 space-y-4">
          {duplicateClass && (
            <WarningBanner
              title={`A class named "${duplicateClass.name}" already exists.`}
              description="Choose a different level or arm to create a new class."
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Level</Label>
              <Input {...register("level")} placeholder="Level (e.g. JSS 1)" autoFocus={mode === "create"} />
              {errors.level && <p className="text-sm text-destructive mt-1">{errors.level.message}</p>}
            </div>
            <div>
              <Label>Arm</Label>
              <Input {...register("arm")} placeholder="e.g. A (optional)" />
              {errors.arm && <p className="text-sm text-destructive mt-1">{errors.arm.message}</p>}
            </div>
          </div>
          {mode === "create" && (
            <div>
              <Label>School type</Label>
              <SelectDropdown
                options={schoolTypeOptions}
                value={schoolType}
                onChange={setSchoolType}
                placeholder="School type"
              />
              {schoolTypeOptions.length === 0 && (
                <p className="text-xs text-destructive mt-1">
                  Set school types in Settings first.
                </p>
              )}
            </div>
          )}
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
            Class name: <span className="font-medium text-gray900">{watchedName}</span>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving || !!duplicateClass || (mode === "edit" && !isDirty)}
              className="flex-1"
            >
              {saving ? "Saving..." : mode === "edit" ? "Save" : "Add Class"}
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
