import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight2, Element4, RowVertical, Trash } from "iconsax-react";
import toast from "react-hot-toast";

import { Avatar } from "../../components/ui/Avatar";
import { CelebrationDecor } from "../../components/ui/CelebrationDecor";
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
import { getCelebration, type Celebration } from "../../utils/celebrations";
import { cn } from "../../lib/utils";

interface AssignmentRow {
  subjectId: string;
  classIds: string[];
}

type ViewMode = "list" | "grid";

const VIEW_STORAGE_KEY = "soma:admin:teachers-view";

const readView = (): ViewMode =>
  localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";

const teacherCelebration = (t: Teacher): Celebration | null =>
  getCelebration(t.dateOfBirth, "birthday") ??
  getCelebration(t.employmentDate, "anniversary");

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
  const [view, setView] = useState<ViewMode>(readView);

  const setViewMode = (next: ViewMode) => {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-gray100 bg-white p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === "list" ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
              )}
            >
              <RowVertical size={14} color={view === "list" ? "#FFFFFF" : "#8C8C8C"} /> List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                view === "grid" ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
              )}
            >
              <Element4 size={14} color={view === "grid" ? "#FFFFFF" : "#8C8C8C"} /> Grid
            </button>
          </div>
          <Button onClick={() => setShowInvite(true)} size="sm">
            + Invite Teacher
          </Button>
        </div>
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
                        <Trash size={14} color="#CD432F" />
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

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-gray-500 p-8 text-center rounded-xl border border-gray100 bg-white">Loading...</p>
        ) : teachers.length === 0 && pendingInvites.length === 0 ? (
          <p className="text-sm text-gray-500 p-8 text-center rounded-xl border border-gray100 bg-white">No teachers yet.</p>
        ) : view === "grid" ? (
          <>
            {pendingInvites.length > 0 && (
              <div className="mb-4 rounded-xl border border-gray100 bg-white">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-gray-400">—</span>
                      <span className="ml-3 text-gray-500">{invite.email}</span>
                      <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
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
              </div>
            )}
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {teachers.map((t) => {
                const celeb = teacherCelebration(t);
                const className = t.formClass
                  ? classesData?.classes.find((c) => c.id === t.formClassId)?.name ?? t.formClass
                  : null;
                return (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/admin/teachers/${t.id}`)}
                    className="group relative overflow-hidden rounded-2xl border border-gray100 bg-gray50 p-6 pt-9 cursor-pointer transition-all hover:-translate-y-1 hover:border-gray300 hover:shadow-[0_22px_40px_-16px_rgba(0,0,0,0.24)]"
                  >
                    {celeb && <CelebrationDecor type={celeb.type} years={celeb.years} />}
                    <div className="absolute inset-x-0 top-0 h-[7.5rem] bg-gradient-to-b from-gray200 via-gray200/70 to-transparent" />
                    <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.08)_0%,transparent_70%)]" />
                    <div className="pointer-events-none absolute -bottom-16 -left-14 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.06)_0%,transparent_70%)]" />
                    <div className="absolute left-6 top-6 h-1 w-12 rounded-full bg-black/15" />
                    <div className="absolute right-6 top-6 h-7 w-7 rounded-full border-2 border-dashed border-black/20" />
                    <img
                      src="/icons/somawordmark_black.svg"
                      alt=""
                      className="pointer-events-none absolute -bottom-4 -right-4 w-40 opacity-[0.16]"
                    />
                    <div className="relative flex flex-col items-center pt-10">
                      <div className="relative">
                        <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-black/15 via-transparent to-black/5 blur-md" />
                        <Avatar
                          name={t.name}
                          size={84}
                          className="relative border-2 border-white shadow-[0_10px_24px_-8px_rgba(0,0,0,0.25)] ring-1 ring-black/5"
                        />
                      </div>
                      <p className="mt-4 w-full truncate text-center text-[15px] font-semibold text-gray900">
                        {t.name}
                      </p>
                      <p className="mt-1 w-full truncate text-center text-xs text-gray500">{t.email}</p>
                      {className && (
                        <span className="mt-2.5 inline-block rounded-full bg-gray100 px-3 py-1 text-[10px] font-medium text-gray600">
                          {className}
                        </span>
                      )}
                      <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-gray400 capitalize">
                        {t.role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray100">
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
          </div>
        )}
      </div>
    </div>
  );
};
