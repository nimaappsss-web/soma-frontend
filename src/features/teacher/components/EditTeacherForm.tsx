import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "iconsax-react";
import toast from "react-hot-toast";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { MultiSelect, type SelectOption } from "../../../components/ui/multi-select";
import { useAuth } from "../../../contexts/AuthContext";
import { useClasses, useSubjects } from "../../principal/api";
import { useTeacherDetail } from "../api";
import { editTeacherSchema, type EditTeacherFormData } from "../utils/validationSchema";
import type { UpdateTeacherPayload } from "../types";
import { db, type TeacherCache } from "../../../db/db";
import { addToQueue } from "../../../sync/syncQueue";
import { transformError } from "../../../utils/transformError";

interface AssignmentRow {
  subjectId: string;
  classIds: string[];
}

interface EditTeacherFormProps {
  teacherId: string;
  onDone: () => void;
  onCancel: () => void;
}

export const EditTeacherForm = ({ teacherId, onDone, onCancel }: EditTeacherFormProps) => {
  const { user } = useAuth();
  const { data: teacherDetail } = useTeacherDetail(teacherId);
  const { data: classesData } = useClasses();
  const { data: subjects } = useSubjects();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [assignmentsTouched, setAssignmentsTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EditTeacherFormData>({
    resolver: zodResolver(editTeacherSchema),
  });

  const classes = classesData?.classes ?? [];
  const classOptions: SelectOption[] = classes.map((c) => ({ value: c.id, label: c.name }));
  const subjectOptions: SelectOption[] = (subjects ?? []).map((s) => ({ value: s.id, label: s.name }));

  useEffect(() => {
    if (!teacherDetail || isDirty || assignmentsTouched) return;
    reset({
      name: teacherDetail.name,
      formClassId: teacherDetail.formClassId ?? "",
    });
    setAssignments(
      (teacherDetail.assignments ?? []).map((a) => ({
        subjectId: a.subject.id,
        classIds: a.classes.map((c) => c.id),
      })),
    );
  }, [teacherDetail, isDirty, assignmentsTouched, reset]);

  const handleAddSubject = () => {
    setAssignments((prev) => [...prev, { subjectId: "", classIds: [] }]);
    setAssignmentsTouched(true);
  };

  const handleRemoveSubject = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
    setAssignmentsTouched(true);
  };

  const handleSubjectChange = (index: number, subjectId: string) => {
    setAssignments((prev) => prev.map((a, i) => (i === index ? { ...a, subjectId } : a)));
    setAssignmentsTouched(true);
  };

  const handleClassChange = (index: number, classIds: string[]) => {
    setAssignments((prev) => prev.map((a, i) => (i === index ? { ...a, classIds } : a)));
    setAssignmentsTouched(true);
  };

  const onSubmit = async (formData: EditTeacherFormData) => {
    if (!teacherId || !user) return;
    setSaving(true);
    try {
      const payload: UpdateTeacherPayload = {
        name: formData.name.trim(),
        formClassId: formData.formClassId || null,
        assignments: assignments
          .filter((a) => a.subjectId)
          .map((a) => ({ subjectId: a.subjectId, classIds: a.classIds })),
      };
      const existing = await db.teachers.get(teacherId);
      const merged = { ...existing, ...payload, id: teacherId, userId: user.id } as TeacherCache;
      await db.teachers.put(merged, teacherId);
      await addToQueue({
        userId: user.id,
        table: "teachers",
        recordId: teacherId,
        endpoint: `/teachers/${teacherId}`,
        method: "PATCH",
        payload,
      });
      toast.success("Teacher updated!");
      onDone();
    } catch (err) {
      toast.error(transformError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-teacher-name" className="mb-1.5 block">
            Full Name *
          </Label>
          <Input
            id="edit-teacher-name"
            type="text"
            registration={register("name")}
            hasError={errors.name}
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Form Class</Label>
          <SelectDropdown
            placeholder="None"
            options={classOptions}
            value={watch("formClassId") ?? ""}
            onChange={(v) => setValue("formClassId", v)}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Subjects Taught</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddSubject}>
            + Add Subject
          </Button>
        </div>

        {assignments.length === 0 ? (
          <p className="text-sm text-gray-400">No subjects assigned.</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((a, i) => (
              <div key={i} className="rounded-lg border border-gray-100 p-3 space-y-3">
                <SelectDropdown
                  options={subjectOptions}
                  value={a.subjectId}
                  onChange={(val) => handleSubjectChange(i, val)}
                  placeholder="Select subject"
                  searchable
                />
                <div>
                  <Label className="mb-1.5 block">Classes</Label>
                  <MultiSelect
                    options={classOptions}
                    selected={a.classIds}
                    onChange={(ids) => handleClassChange(i, ids)}
                    placeholder="Select classes"
                    searchable
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRemoveSubject(i)}
                >
                  <Trash size={14} color="#CD432F" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Saving..." : "Update"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};