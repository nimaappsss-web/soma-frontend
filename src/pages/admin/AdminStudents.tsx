import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Element4, RowVertical, Trash } from "iconsax-react";
import { Avatar } from "../../components/ui/Avatar";
import { Input } from "../../components/ui/input";
import { SelectDropdown } from "../../components/ui/select-dropdown";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { useAllStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useBulkDeleteStudents } from "../../features/students/api";
import { BulkAddStudents } from "../../features/students/components/BulkAddStudents";
import { StudentFormDialog } from "../../features/students/components/StudentFormDialog";
import { useClasses } from "../../features/principal/api";
import { createStudentSchema, type CreateStudentFormData } from "../../features/students/utils/validationSchema";
import { findDuplicateStudents, type StudentDuplicate } from "../../features/students/utils/dedupe";
import type { Student, CreateStudentPayload, UpdateStudentPayload } from "../../features/students/types";
import { DuplicateConfirmDialog } from "../../components/others/DuplicateConfirmDialog";
import { CelebrationDecor } from "../../components/ui/CelebrationDecor";
import { getCelebration } from "../../utils/celebrations";
import { cn } from "../../lib/utils";
type ViewMode = "list" | "grid";
const VIEW_STORAGE_KEY = "soma:admin:students-view";
const readView = (): ViewMode =>
  localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";
export const AdminStudents = () => {
  const { user } = useAuth();
  const { data: classesData } = useClasses();
  const { data: allStudents, isLoading } = useAllStudents(user?.id ?? "");
  const [classFilter, setClassFilter] = useState("");
  const [view, setView] = useState<ViewMode>(readView);
  const setViewMode = (next: ViewMode) => {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };
  const createMutation = useCreateStudent();
  const deleteMutation = useDeleteStudent();
  const bulkDeleteMutation = useBulkDeleteStudents();
  const updateMutation = useUpdateStudent();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [dupState, setDupState] = useState<{ payload: CreateStudentPayload; matches: StudentDuplicate[] } | null>(null);
  const filtered = useMemo(
    () => classFilter
      ? allStudents.filter((s) => s.classId === classFilter)
      : allStudents,
    [allStudents, classFilter],
  );
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)),
    );
  }, [filtered]);
  const handleDelete = (s: Student) => {
    if (!window.confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    deleteMutation.mutate(s.id);
  };
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!window.confirm(`Delete ${count} student${count > 1 ? "s" : ""}? This cannot be undone.`)) return;
    bulkDeleteMutation.mutate(Array.from(selectedIds), {
      onSuccess: () => setSelectedIds(new Set()),
    });
  };
  useEffect(() => { setSelectedIds(new Set()); }, [classFilter]);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      name: "", gender: "", parentName: "", parentPhone: "",
      parentEmail: "", dateOfBirth: "", address: "",
    },
  });
  const onAdd = async (data: CreateStudentFormData) => {
    if (!classFilter) return;
    const payload: CreateStudentPayload = {
      name: data.name,
      classId: classFilter,
      gender: data.gender || undefined,
      parentName: data.parentName || undefined,
      parentPhone: data.parentPhone || undefined,
      parentEmail: data.parentEmail || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      address: data.address || undefined,
    };
    const dups = await findDuplicateStudents({
      name: data.name,
      classId: classFilter,
      gender: data.gender || undefined,
      parentName: data.parentName || undefined,
    });
    if (dups.length > 0) {
      setDupState({ payload, matches: dups });
      return;
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  };
  const confirmCreate = () => {
    if (!dupState) return;
    createMutation.mutate(dupState.payload, {
      onSuccess: () => {
        reset();
        setShowForm(false);
        setDupState(null);
      },
    });
  };
  const closeForm = () => {
    reset();
    setShowForm(false);
  };
  const startEditing = (s: Student) => {
    setEditingStudent(s);
    setShowForm(false);
    setShowBulk(false);
  };
  const handleUpdateSubmit = (payload: Record<string, unknown>) => {
    if (!editingStudent) return;
    updateMutation.mutate(
      { id: editingStudent.id, data: payload as UpdateStudentPayload },
      { onSuccess: () => setEditingStudent(null) },
    );
  };
  const field = (label: string, key: keyof CreateStudentFormData, placeholder: string, type = "text") => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {key === "gender" ? (
        <Controller
          control={control}
          name="gender"
          render={({ field: genderField }) => (
            <SelectDropdown
              options={[
                { value: "", label: "Select" },
                { value: "M", label: "Male" },
                { value: "F", label: "Female" },
              ]}
              value={genderField.value ?? ""}
              onChange={genderField.onChange}
            />
          )}
        />
      ) : (
        <Input
          type={type}
          {...register(key)}
          placeholder={placeholder}
        />
      )}
      {errors[key] && (
        <p className="text-xs text-destructive mt-1">{errors[key]?.message}</p>
      )}
    </div>
  );
  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
        <div className="flex flex-wrap gap-3">
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
          <SelectDropdown
            value={classFilter}
            onChange={setClassFilter}
            placeholder="All classes"
            className="w-full sm:w-56"
            options={(classesData?.classes ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <Button
            variant="outline"
            onClick={() => { setShowBulk(true); setShowForm(false); }}
          >
            Bulk Add
          </Button>
          <Button
            variant="default"
            onClick={() => { if (!classFilter) return; setShowForm(true); setShowBulk(false); }}
            disabled={!classFilter}
          >
            Add Student
          </Button>
        </div>
      </div>
      {showBulk && (
        <BulkAddStudents
          classes={classesData?.classes ?? []}
          onClose={() => setShowBulk(false)}
        />
      )}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">New Student — {classesData?.classes.find(c => c.id === classFilter)?.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("Full Name *", "name", "Chidi Okonkwo")}
            {field("Gender", "gender", "")}
            {field("Date of Birth", "dateOfBirth", "", "date")}
            {field("Address", "address", "15 Awolowo Road, Ikoyi")}
            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Parent/Guardian</p>
            </div>
            {field("Parent Name", "parentName", "Mr. Okonkwo")}
            {field("Parent Phone *", "parentPhone", "08012345678")}
            {field("Parent Email", "parentEmail", "okonkwo@email.com")}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSubmit(onAdd)}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-green-700"
            >
              {createMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button onClick={closeForm} className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-6 py-3">
            <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 disabled:opacity-50"
            >
              <Trash size={14} variant="Bold" color="#CD432F" />
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete (${selectedIds.size})`}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
{isLoading ? (
          <p className="text-sm text-gray-400 p-6 text-center rounded-xl border border-gray100 bg-white">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center rounded-xl border border-gray100 bg-white">
            {classFilter ? "No students in this class." : "No students yet."}
          </p>
        ) : view === "grid" ? (
          <>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-400">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 cursor-pointer rounded-md border-gray-300 accent-black"
              />
              <span>{allSelected ? "Deselect all" : "Select all"}</span>
              {selectedIds.size > 0 && (
                <span className="text-gray-500">({selectedIds.size} selected)</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((s) => {
              const className = classesData?.classes.find((c) => c.id === s.classId)?.name;
              const celeb = getCelebration(s.dateOfBirth, "birthday");
              return (
                <div
                  key={s.id}
                  className="group relative overflow-hidden rounded-tl-3xl rounded-tr-[28px] rounded-br-3xl rounded-bl-[28px] border border-gray100 bg-white p-6 pt-9 transition-all hover:-translate-y-0.5 hover:border-gray300 hover:shadow-[0_16px_30px_-14px_rgba(0,0,0,0.18)]"
                >
                  {celeb && <CelebrationDecor type={celeb.type} years={celeb.years} />}
                  <div className="absolute left-6 top-6 h-1 w-10 rounded-full bg-black/15" />
                  <div className="absolute right-6 top-6 h-6 w-6 rounded-full border-2 border-dashed border-black/20" />
                  <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.06)_0%,transparent_70%)]" />
                  <div className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.05)_0%,transparent_70%)]" />
                  <img
                    src="/icons/somawordmark_black.svg"
                    alt=""
                    className="pointer-events-none absolute -bottom-2 -right-3 w-28 opacity-[0.12] transition-opacity group-hover:opacity-20"
                  />
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleSelect(s.id)}
                    className="absolute bottom-5 right-5 z-20 h-4 w-4 cursor-pointer rounded-md border-gray-300 accent-black"
                  />
                  <div className="relative flex flex-col items-center pt-2">
                    <Link
                      to={`/admin/students/${s.id}`}
                      className="relative flex flex-col items-center"
                      aria-label={`View ${s.name}`}
                    >
                      <div className="absolute -inset-2.5 rounded-full bg-gradient-to-br from-black/10 via-transparent to-black/5 blur-md" />
                      <Avatar
                        name={s.name}
                        size={72}
                        className="relative border-2 border-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.2)] ring-1 ring-black/5"
                      />
                      <p className="mt-5 w-full truncate text-center text-[15px] font-semibold text-gray900">
                        {s.name}
                      </p>
                    </Link>
                    {s.admissionNo && (
                      <p className="mt-1 w-full truncate text-center text-xs text-gray500">{s.admissionNo}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                      {className && (
                        <span className="rounded-full bg-offWhite px-3 py-1.5 text-[11px] font-medium text-gray500">
                          {className}
                        </span>
                      )}
                      <span className="rounded-full bg-offWhite px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-gray500">
                        {s.gender ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray100">
            <div className="divide-y divide-gray-100">
            <div className="px-6 py-3 flex items-center gap-3 text-xs text-gray-400 font-medium">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 cursor-pointer rounded-md border-gray-300 accent-black"
              />
              <span>{allSelected ? "Deselect all" : "Select all"}</span>
            </div>
            {filtered.map((s) => {
              const className = classesData?.classes.find(c => c.id === s.classId)?.name;
              return (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="h-4 w-4 cursor-pointer rounded-md border-gray-300 accent-black shrink-0"
                    />
                    <Avatar name={s.name} size={32} />
                    <div>
                      <Link to={`/admin/students/${s.id}`} className="text-gray-800 font-medium hover:text-blue-600">
                        {s.name}
                      </Link>
                      {s.admissionNo && <span className="ml-2 text-xs text-gray-400">{s.admissionNo}</span>}
                      {className && <span className="ml-2 text-xs text-blue-500">{className}</span>}
                      {s.parentPhone && (
                        <span className="ml-3 text-xs text-gray-400">{s.parentName ?? "—"} · {s.parentPhone}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{s.gender ?? "—"}</span>
                    <button
                      onClick={() => startEditing(s)}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Delete student"
                    >
                      <Trash size={16} variant="Bold" color="#8C8C8C" />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      <DuplicateConfirmDialog
        open={!!dupState}
        onOpenChange={(open) => { if (!open) setDupState(null); }}
        title="Student with this name already exists"
        description={dupState
          ? `"${dupState.payload.name}" is already in ${classesData?.classes.find(c => c.id === classFilter)?.name ?? "this class"}.`
          : ""}
        highlight="Check the existing record before adding — it may be the same person or a different student with the same name."
        confirmLabel="Add anyway"
        onConfirm={confirmCreate}
      >
        {dupState && (
          <div className="space-y-2">
            {dupState.matches.map((m) => (
              <div key={m.id} className="rounded-lg border border-gray100 bg-gray50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray900">{m.name}</span>
                  <span
                    className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                      m.exact ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {m.exact ? "Exact match" : "Similar"}
                  </span>
                </div>
                <div className="text-xs text-gray500 mt-1 space-y-0.5">
                  {m.admissionNo && <p>Admission: {m.admissionNo}</p>}
                  <p>Gender: {m.gender ?? "—"}</p>
                  {m.parentName && (
                    <p>Parent: {m.parentName}{m.parentPhone ? ` · ${m.parentPhone}` : ""}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DuplicateConfirmDialog>
      <StudentFormDialog
        open={!!editingStudent}
        onOpenChange={(open) => { if (!open) setEditingStudent(null); }}
        student={editingStudent}
        classes={(classesData?.classes ?? []).map((c) => ({ value: c.id, label: c.name }))}
        isSaving={updateMutation.isPending}
        onSubmit={handleUpdateSubmit}
      />
    </div>
  );
};
