import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { MultiSelect, type SelectOption } from "../../../components/ui/multi-select";
import { useAuth } from "../../../contexts/AuthContext";
import { useClasses, useSubjects } from "../../principal/api";
import { useClassSubjects } from "../../class-subjects/api";
import { subjectIdsForClasses } from "../../class-subjects/utils/subjectsForClasses";
import { useTeacherDetail, useTeachers } from "../api";
import { editTeacherSchema, type EditTeacherFormData } from "../utils/validationSchema";
import type { TeacherDetail, UpdateTeacherPayload } from "../types";
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
  const { data: teachersData } = useTeachers();
  const { data: classesData } = useClasses();
  const { data: subjects } = useSubjects();
  const { data: classSubjectList = [] } = useClassSubjects();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [assignmentsTouched, setAssignmentsTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditTeacherFormData>({
    resolver: zodResolver(editTeacherSchema),
  });

  const classes = classesData?.classes ?? [];
  const teachers = teachersData?.teachers ?? [];
  const formClassOwner = new Map<string, string>();
  teachers.forEach((t) => {
    if (t.formClassId && t.id !== teacherId && !formClassOwner.has(t.formClassId)) {
      formClassOwner.set(t.formClassId, t.name);
    }
  });
  const classOptions: SelectOption[] = classes.map((c) => {
    const takenBy = formClassOwner.get(c.id);
    return {
      value: c.id,
      label: c.name,
      badge: takenBy,
      badgeTone: takenBy ? "taken" : undefined,
      disabled: !!takenBy,
    };
  });
  const subjectOptions: SelectOption[] = (subjects ?? []).map((s) => ({ value: s.id, label: s.name }));

  const availableSubjects = (classIds: string[], current: string): SelectOption[] => {
    if (classIds.length === 0) return subjectOptions;
    const allowed = subjectIdsForClasses(classSubjectList, classIds);
    const list = subjectOptions.filter((o) => allowed.has(o.value));
    if (current && !list.some((o) => o.value === current)) {
      const cur = (subjects ?? []).find((s) => s.id === current);
      if (cur) list.push({ value: cur.id, label: cur.name });
    }
    return list;
  };

  useEffect(() => {
    // Populate whenever the detail arrives. NOTE: this must NOT be gated on RHF
    // isDirty — without defaultValues RHF reports isDirty=true once inputs mount
    // ("" vs {}), so the first (async) detail load would be skipped forever.
    if (!teacherDetail || assignmentsTouched) return;
    reset({
      name: teacherDetail.name,
      email: teacherDetail.email ?? "",
      formClassId: teacherDetail.formClassId ?? "",
    });
    setAssignments(
      (teacherDetail.assignments ?? []).map((a) => ({
        subjectId: a.subject.id,
        classIds: a.classes.map((c) => c.id),
      })),
    );
  }, [teacherDetail, assignmentsTouched, reset]);

  const handleSubjectsChange = (ids: string[]) => {
    setAssignmentsTouched(true);
    setAssignments((prev) =>
      ids.map((id) => prev.find((a) => a.subjectId === id) ?? { subjectId: id, classIds: [] }),
    );
  };

  const handleClassesChange = (subjectId: string, classIds: string[]) => {
    setAssignmentsTouched(true);
    setAssignments((prev) =>
      prev.map((a) => (a.subjectId === subjectId ? { ...a, classIds } : a)),
    );
  };

  const onSubmit = async (formData: EditTeacherFormData) => {
    if (!teacherId || !user) return;
    const takenBy = formData.formClassId ? formClassOwner.get(formData.formClassId) : undefined;
    if (takenBy) {
      toast.error(`This class already has ${takenBy} as class teacher`);
      return;
    }
    setSaving(true);
    try {
      // Only send the email when the teacher actually changed it. The field is
      // pre-filled from the cached detail, so sending it unconditionally could
      // push a stale email back to the server (reverting a newer one) and
      // wrongly force re-verification on a name-only edit.
      const originalEmail = (teacherDetail?.email ?? "").trim().toLowerCase();
      const nextEmail = (formData.email ?? "").trim();
      const emailChanged = nextEmail !== "" && nextEmail.toLowerCase() !== originalEmail;

      const payload: UpdateTeacherPayload = {
        name: formData.name.trim(),
        ...(emailChanged ? { email: nextEmail } : {}),
        formClassId: formData.formClassId || null,
        assignments: assignments
          .filter((a) => a.subjectId)
          .map((a) => ({ subjectId: a.subjectId, classIds: a.classIds })),
      };
      const existing = await db.teachers.get(teacherId);
      const merged = { ...existing, ...payload, id: teacherId, userId: user.id } as TeacherCache;
      await db.teachers.put(merged, teacherId);

      // Keep the cached detail fresh so reopening the form shows the saved email.
      // NOTE: payload.assignments uses { subjectId, classIds }, which must NOT
      // clobber the cached detail's server shape ({ subject, classes }) — doing
      // so corrupts the cache and crashes the detail page on a.subject.name.
      const detailRec = await db.teacherDetails.get(teacherId);
      const baseDetail: TeacherDetail | undefined = detailRec
        ? (JSON.parse(detailRec.detailJson) as TeacherDetail)
        : teacherDetail;
      if (baseDetail) {
        const subjectById = new Map((subjects ?? []).map((s) => [s.id, s]));
        const classById = new Map(classes.map((c) => [c.id, c]));
        const nextAssignments: TeacherDetail["assignments"] = payload.assignments
          .filter((a) => a.subjectId && subjectById.has(a.subjectId))
          .map((a) => {
            const subj = subjectById.get(a.subjectId)!;
            const prev = baseDetail.assignments.find((d) => d.subject.id === a.subjectId);
            return {
              id: prev?.id ?? a.subjectId,
              subject: { id: subj.id, name: subj.name, code: subj.code },
              classes: (a.classIds ?? [])
                .filter((cid) => classById.has(cid))
                .map((cid) => {
                  const c = classById.get(cid)!;
                  return { id: c.id, name: c.name, level: c.level, arm: c.arm, schoolType: c.schoolType };
                }),
            };
          });
        await db.teacherDetails.put(
          {
            id: teacherId,
            userId: user.id,
            detailJson: JSON.stringify({ ...baseDetail, ...payload, assignments: nextAssignments }),
          },
          teacherId,
        );
      }

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
          {(() => {
            const takenBy = watch("formClassId")
              ? formClassOwner.get(watch("formClassId"))
              : undefined;
            if (!takenBy) return null;
            return (
              <p className="mt-2 text-xs text-red-500">
                This class already has {takenBy} as class teacher
              </p>
            );
          })()}
        </div>
      </div>

      <div>
        <Label htmlFor="edit-teacher-email" className="mb-1.5 block">
          Email
        </Label>
        <Input
          id="edit-teacher-email"
          type="email"
          placeholder="teacher@school.com"
          registration={register("email")}
          hasError={errors.email}
        />
        <p className="mt-1.5 text-xs text-placeholder">
          Changing the email will require the teacher to verify the new address before they can sign in.
        </p>
      </div>

      <div>
        <Label className="mb-1.5 block">Subjects Taught</Label>
        <MultiSelect
          options={subjectOptions}
          selected={assignments.map((a) => a.subjectId)}
          onChange={handleSubjectsChange}
          placeholder="Select subjects"
          searchable
        />
        {assignments.length === 0 ? (
          <p className="mt-1.5 text-sm text-gray-400">No subjects assigned.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {assignments.map((a) => {
              const subject = (subjects ?? []).find((s) => s.id === a.subjectId);
              return (
                <div key={a.subjectId} className="rounded-lg border border-gray-100 p-3 space-y-3">
                  <p className="text-sm font-medium text-gray900">{subject?.name ?? "Subject"}</p>
                  <div>
                    <Label className="mb-1.5 block">Classes</Label>
                    <MultiSelect
                      options={classOptions}
                      selected={a.classIds}
                      onChange={(ids) => handleClassesChange(a.subjectId, ids)}
                      placeholder="Select classes"
                      searchable
                    />
                    {a.classIds.length > 0 && availableSubjects(a.classIds, a.subjectId).length === 0 && (
                      <p className="mt-1.5 text-xs text-amber500">
                        No subjects have been assigned to the selected classes yet.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
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