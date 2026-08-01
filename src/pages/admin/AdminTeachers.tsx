import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight2, Trash } from "iconsax-react";
import toast from "react-hot-toast";

import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { SelectDropdown } from "../../components/ui/select-dropdown";
import { MultiSelect, type SelectOption } from "../../components/ui/multi-select";
import { useAuth } from "../../contexts/AuthContext";
import { useTeachers, useResendInvite, useTeacherDetail } from "../../features/teacher/api";
import { useClasses, useSubjects } from "../../features/principal/api";
import { InviteTeacherModal } from "../../features/principal/components/InviteTeacherModal";
import { editTeacherSchema, type EditTeacherFormData } from "../../features/teacher/utils/validationSchema";
import type { Teacher, UpdateTeacherPayload } from "../../features/teacher/types";
import { db, type TeacherCache } from "../../db/db";
import { addToQueue } from "../../sync/syncQueue";
import { transformError } from "../../utils/transformError";

interface AssignmentRow {
  subjectId: string;
  classIds: string[];
}

export const AdminTeachers = () => {
  const { user } = useAuth();
  const { data: teachersData, isLoading } = useTeachers();
  const { data: classesData } = useClasses();
  const { data: subjects } = useSubjects();
  const navigate = useNavigate();
  const resendMutation = useResendInvite();

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [editAssignments, setEditAssignments] = useState<AssignmentRow[]>([]);
  const [editAssignmentsTouched, setEditAssignmentsTouched] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const { data: teacherDetail } = useTeacherDetail(detailId ?? "");

  const teachers = teachersData?.teachers ?? [];
  const pendingInvites = teachersData?.pendingInvites ?? [];

  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    watch: watchEdit,
    setValue: setEditValue,
    formState: { errors: editErrors, isDirty: editDirty },
  } = useForm<EditTeacherFormData>({
    resolver: zodResolver(editTeacherSchema),
  });

  const classes = classesData?.classes ?? [];
  const classOptions: SelectOption[] = classes.map((c) => ({ value: c.id, label: c.name }));
  const subjectOptions: SelectOption[] = (subjects ?? []).map((s) => ({ value: s.id, label: s.name }));

  const startEditing = (t: Teacher) => {
    setEditingTeacher(t);
    setDetailId(t.id);
    setShowInvite(false);
    resetEdit({ name: t.name, formClassId: t.formClassId ?? "" });
    setEditAssignments([]);
    setEditAssignmentsTouched(false);
  };

  useEffect(() => {
    if (!teacherDetail || !editingTeacher || editDirty || editAssignmentsTouched) return;
    resetEdit({
      name: teacherDetail.name,
      formClassId: teacherDetail.formClassId ?? "",
    });
    setEditAssignments(
      (teacherDetail.assignments ?? []).map((a) => ({
        subjectId: a.subject.id,
        classIds: a.classes.map((c) => c.id),
      })),
    );
  }, [teacherDetail, editingTeacher, editDirty, editAssignmentsTouched, resetEdit]);

  const handleAddSubject = () => {
    setEditAssignments((prev) => [...prev, { subjectId: "", classIds: [] }]);
    setEditAssignmentsTouched(true);
  };

  const handleRemoveSubject = (index: number) => {
    setEditAssignments((prev) => prev.filter((_, i) => i !== index));
    setEditAssignmentsTouched(true);
  };

  const handleSubjectChange = (index: number, subjectId: string) => {
    setEditAssignments((prev) => prev.map((a, i) => (i === index ? { ...a, subjectId } : a)));
    setEditAssignmentsTouched(true);
  };

  const handleClassChange = (index: number, classIds: string[]) => {
    setEditAssignments((prev) => prev.map((a, i) => (i === index ? { ...a, classIds } : a)));
    setEditAssignmentsTouched(true);
  };

  const onEdit = async (formData: EditTeacherFormData) => {
    if (!editingTeacher || !user) return;
    setSavingEdit(true);
    try {
      const { id } = editingTeacher;
      const payload: UpdateTeacherPayload = {
        name: formData.name.trim(),
        formClassId: formData.formClassId || null,
        assignments: editAssignments
          .filter((a) => a.subjectId)
          .map((a) => ({ subjectId: a.subjectId, classIds: a.classIds })),
      };
      const existing = await db.teachers.get(id);
      const merged = { ...existing, ...payload, id, userId: user.id } as TeacherCache;
      await db.teachers.put(merged, id);
      await addToQueue({
        userId: user.id,
        table: "teachers",
        recordId: id,
        endpoint: `/teachers/${id}`,
        method: "PATCH",
        payload,
      });
      toast.success("Teacher updated!");
      setEditingTeacher(null);
      setDetailId(null);
      resetEdit();
      setEditAssignments([]);
      setEditAssignmentsTouched(false);
    } catch (err) {
      toast.error(transformError(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelEdit = () => {
    setEditingTeacher(null);
    setDetailId(null);
    resetEdit();
    setEditAssignments([]);
    setEditAssignmentsTouched(false);
  };

  const formatExpiry = (seconds: number) => {
    if (seconds < 60) return "Expiring soon";
    const hours = Math.round(seconds / 3600);
    return `${hours}h remaining`;
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Teachers</h1>
        <Button onClick={() => setShowInvite(true)} size="sm">
          + Invite Teacher
        </Button>
      </div>

      <InviteTeacherModal open={showInvite} onClose={() => setShowInvite(false)} />

      {editingTeacher && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Edit Teacher — {editingTeacher.name}</h3>
          <form onSubmit={handleEditSubmit(onEdit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-teacher-name" className="mb-1.5 block">
                  Full Name *
                </Label>
                <Input
                  id="edit-teacher-name"
                  type="text"
                  registration={editRegister("name")}
                  hasError={editErrors.name}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Form Class</Label>
                <SelectDropdown
                  placeholder="None"
                  options={classOptions}
                  value={watchEdit("formClassId") ?? ""}
                  onChange={(v) => setEditValue("formClassId", v)}
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

              {editAssignments.length === 0 ? (
                <p className="text-sm text-gray-400">No subjects assigned.</p>
              ) : (
                <div className="space-y-4">
                  {editAssignments.map((a, i) => (
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
                        <Trash size={14} />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="submit" size="sm" disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Update"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100">
        {isLoading ? (
          <p className="text-sm text-gray-400 p-6 text-center">Loading...</p>
        ) : teachers.length === 0 && pendingInvites.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">No teachers yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <span className="text-gray-400">—</span>
                  <span className="ml-3 text-gray-500">{invite.email}</span>
                  <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                    Pending
                  </span>
                  <span className="ml-2 text-xs text-gray-400">{formatExpiry(invite.expiresIn)}</span>
                </div>
                <button
                  onClick={() => resendMutation.mutate(invite.id)}
                  disabled={resendMutation.isPending}
                  className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 underline"
                >
                  {resendMutation.isPending ? "..." : "Resend"}
                </button>
              </div>
            ))}
            {teachers.map((t) => {
              const className = t.formClass
                ? classesData?.classes.find((c) => c.id === t.formClassId)?.name ?? t.formClass
                : null;
              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/admin/teachers/${t.id}`)}
                  className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={t.name} size={32} />
                    <div className="min-w-0">
                      <span className="text-gray-800 font-medium">{t.name}</span>
                      <span className="ml-3 text-sm text-gray-400">{t.email}</span>
                      {className && (
                        <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {className}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-gray-400 capitalize">{t.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(t);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Edit
                    </button>
                    <ArrowRight2 size={16} color="#BBBBBB" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
