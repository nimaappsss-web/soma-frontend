import { useState, useMemo, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash } from "iconsax-react";

import { Avatar } from "../../components/ui/Avatar";
import { Input } from "../../components/ui/input";
import { SelectDropdown } from "../../components/ui/select-dropdown";
import { useAuth } from "../../contexts/AuthContext";
import { useAllStudents, useCreateStudent, useStudentDetail, useDeleteStudent, useBulkDeleteStudents } from "../../features/students/api";
import { BulkAddStudents } from "../../features/students/components/BulkAddStudents";
import { useClasses } from "../../features/principal/api";
import { createStudentSchema, editStudentSchema, type CreateStudentFormData, type EditStudentFormData } from "../../features/students/utils/validationSchema";
import type { Student } from "../../features/students/types";
import { db } from "../../db/db";
import type { Student as StudentCache } from "../../db/db";
import { addToQueue } from "../../sync/syncQueue";
import { transformError } from "../../utils/transformError";
import toast from "react-hot-toast";

export const AdminStudents = () => {
  const { user } = useAuth();
  const { data: classesData } = useClasses();
  const { data: allStudents, isLoading } = useAllStudents(user?.id ?? "");
  const [classFilter, setClassFilter] = useState("");
  const createMutation = useCreateStudent();
  const deleteMutation = useDeleteStudent();
  const bulkDeleteMutation = useBulkDeleteStudents();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const { data: studentDetail } = useStudentDetail(detailId ?? "");

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

  const onAdd = (data: CreateStudentFormData) => {
    if (!classFilter) return;
    createMutation.mutate(
      {
        name: data.name,
        classId: classFilter,
        gender: data.gender || undefined,
        parentName: data.parentName || undefined,
        parentPhone: data.parentPhone || undefined,
        parentEmail: data.parentEmail || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        address: data.address || undefined,
      },
      {
        onSuccess: () => {
          reset();
          setShowForm(false);
        },
      },
    );
  };

  const closeForm = () => {
    reset();
    setShowForm(false);
  };

  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    control: editControl,
    formState: { errors: editErrors, isDirty: editDirty },
  } = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentSchema),
  });

  const startEditing = (s: Student) => {
    setEditingStudent(s);
    setDetailId(s.id);
    setShowForm(false);
    setShowBulk(false);
    resetEdit({
      name: s.name,
      gender: s.gender ?? "",
      dateOfBirth: s.dateOfBirth?.split("T")[0] ?? "",
      address: s.address ?? "",
      parentName: s.parentName ?? "",
      parentPhone: s.parentPhone ?? "",
      parentEmail: s.parentEmail ?? "",
      status: s.status,
      classId: s.classId,
    });
  };

  useEffect(() => {
    if (!studentDetail || !editingStudent || editDirty) return;
    resetEdit({
      name: studentDetail.name,
      gender: studentDetail.gender ?? "",
      dateOfBirth: studentDetail.dateOfBirth?.split("T")[0] ?? "",
      address: studentDetail.address ?? "",
      parentName: studentDetail.parentName ?? "",
      parentPhone: studentDetail.parentPhone ?? "",
      parentEmail: studentDetail.parentEmail ?? "",
      status: studentDetail.status,
      classId: studentDetail.classId,
    });
  }, [studentDetail]);

  const [savingEdit, setSavingEdit] = useState(false);

  const onEdit = async (formData: EditStudentFormData) => {
    if (!editingStudent) return;
    setSavingEdit(true);
    try {
      const { id } = editingStudent;
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value !== "" && value !== undefined) payload[key] = value;
      }
      const existing = await db.students.where({ id, userId: user!.id }).first();
      const merged = { ...existing, ...payload, userId: user!.id, createdAt: Date.now() } as StudentCache;
      await db.students.put(merged, id);
      await addToQueue({
        userId: user!.id,
        table: "students",
        recordId: id,
        endpoint: `/students/${id}`,
        method: "PATCH",
        payload,
      });
      toast.success("Student updated!");
      setEditingStudent(null);
      setDetailId(null);
      resetEdit();
    } catch (err) {
      toast.error(transformError(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelEdit = () => {
    setEditingStudent(null);
    setDetailId(null);
    resetEdit();
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
        <div className="flex flex-wrap gap-3">
          <SelectDropdown
            value={classFilter}
            onChange={setClassFilter}
            placeholder="All classes"
            className="w-full sm:w-56"
            options={(classesData?.classes ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          <button
            onClick={() => { setShowBulk(true); setShowForm(false); }}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50"
          >
            Bulk Add
          </button>
          <button
            onClick={() => { if (!classFilter) return; setShowForm(true); setShowBulk(false); }}
            disabled={!classFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Add Student
          </button>
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

      {editingStudent && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Edit Student — {editingStudent.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
              <Input type="text" {...editRegister("name")} />
              {editErrors.name && <p className="text-xs text-destructive mt-1">{editErrors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Class *</label>
              <Controller
                control={editControl}
                name="classId"
                render={({ field }) => (
                  <SelectDropdown
                    placeholder="Select class"
                    options={(classesData?.classes ?? []).map((c) => ({ value: c.id, label: c.name }))}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
              {editErrors.classId && <p className="text-xs text-destructive mt-1">{editErrors.classId.message}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Gender</label>
              <Controller
                control={editControl}
                name="gender"
                render={({ field }) => (
                  <SelectDropdown
                    placeholder="Select"
                    options={[
                      { value: "M", label: "Male" },
                      { value: "F", label: "Female" },
                    ]}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
              <Input type="date" {...editRegister("dateOfBirth")} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <Controller
                control={editControl}
                name="status"
                render={({ field }) => (
                  <SelectDropdown
                    options={[
                      { value: "ACTIVE", label: "Active" },
                      { value: "TRANSFERRED", label: "Transferred" },
                      { value: "WITHDRAWN", label: "Withdrawn" },
                      { value: "GRADUATED", label: "Graduated" },
                    ]}
                    value={field.value ?? "ACTIVE"}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Address</label>
              <Input type="text" {...editRegister("address")} placeholder="15 Awolowo Road, Ikoyi" />
            </div>
            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Parent/Guardian</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Parent Name</label>
              <Input type="text" {...editRegister("parentName")} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Parent Phone</label>
              <Input type="tel" {...editRegister("parentPhone")} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Parent Email</label>
              <Input type="email" {...editRegister("parentEmail")} />
              {editErrors.parentEmail && <p className="text-xs text-destructive mt-1">{editErrors.parentEmail.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleEditSubmit(onEdit)}
              disabled={savingEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
            >
              {savingEdit ? "Saving..." : "Update"}
            </button>
            <button onClick={cancelEdit} className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {selectedIds.size > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
            <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 disabled:opacity-50"
            >
              <Trash size={14} variant="Bold" />
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
          <p className="text-sm text-gray-400 p-6 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">
            {classFilter ? "No students in this class." : "No students yet."}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-3 flex items-center gap-3 text-xs text-gray-400 font-medium">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 accent-black"
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
                      className="h-4 w-4 rounded border-gray-300 accent-black shrink-0"
                    />
                    <Avatar name={s.name} size={32} />
                    <div>
                      <span className="text-gray-800 font-medium">{s.name}</span>
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
                      <Trash size={16} variant="Bold" />
                    </button>
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
