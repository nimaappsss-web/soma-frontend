import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../../contexts/AuthContext";
import { useAllStudents, useCreateStudent, useStudentDetail } from "../../features/students/api";
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
  const { user, logout } = useAuth();
  const { data: classesData } = useClasses();
  const { data: allStudents, isLoading } = useAllStudents(user?.id ?? "");
  const [classFilter, setClassFilter] = useState("");
  const createMutation = useCreateStudent();
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

  const {
    register,
    handleSubmit,
    reset,
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
      const existing = await db.students.get(id);
      const merged = { ...existing, ...payload, createdAt: Date.now() } as StudentCache;
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
        <select
          {...register("gender")}
          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
        >
          <option value="">Select</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      ) : (
        <input
          type={type}
          {...register(key)}
          placeholder={placeholder}
          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
        />
      )}
      {errors[key] && (
        <p className="text-xs text-destructive mt-1">{errors[key]?.message}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.schoolName}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
            {user?.role}
          </span>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">Sign out</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600">&larr; Dashboard</Link>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">Students</h2>
          </div>
          <div className="flex gap-3">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-10 rounded-md border border-gray-200 px-3 text-sm w-56"
            >
              <option value="">All classes</option>
              {classesData?.classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
                <input type="text" {...editRegister("name")} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" />
                {editErrors.name && <p className="text-xs text-destructive mt-1">{editErrors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Class *</label>
                <select {...editRegister("classId")} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm">
                  <option value="">Select class</option>
                  {classesData?.classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {editErrors.classId && <p className="text-xs text-destructive mt-1">{editErrors.classId.message}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Gender</label>
                <select {...editRegister("gender")} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm">
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
                <input type="date" {...editRegister("dateOfBirth")} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select {...editRegister("status")} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm">
                  <option value="ACTIVE">Active</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                  <option value="GRADUATED">Graduated</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Address</label>
                <input type="text" {...editRegister("address")} placeholder="15 Awolowo Road, Ikoyi" className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" />
              </div>
              <div className="md:col-span-2 border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Parent/Guardian</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Parent Name</label>
                <input type="text" {...editRegister("parentName")} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Parent Phone</label>
                <input type="tel" {...editRegister("parentPhone")} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Parent Email</label>
                <input type="email" {...editRegister("parentEmail")} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm" />
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
          {isLoading ? (
            <p className="text-sm text-gray-400 p-6 text-center">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 p-6 text-center">
              {classFilter ? "No students in this class." : "No students yet."}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((s) => {
                const className = classesData?.classes.find(c => c.id === s.classId)?.name;
                return (
                  <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-gray-800 font-medium">{s.name}</span>
                      {s.admissionNo && <span className="ml-2 text-xs text-gray-400">{s.admissionNo}</span>}
                      {className && <span className="ml-2 text-xs text-blue-500">{className}</span>}
                      {s.parentPhone && (
                        <span className="ml-3 text-xs text-gray-400">{s.parentName ?? "—"} · {s.parentPhone}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{s.gender ?? "—"}</span>
                      <button
                        onClick={() => startEditing(s)}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
