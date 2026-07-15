import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../contexts/AuthContext";
import { useTeachers, useResendInvite } from "../../features/teacher/api";
import { useClasses } from "../../features/principal/api";
import { editTeacherSchema, type EditTeacherFormData } from "../../features/teacher/utils/validationSchema";
import type { Teacher } from "../../features/teacher/types";
import { db } from "../../db/db";
import type { TeacherCache } from "../../db/db";
import { addToQueue } from "../../sync/syncQueue";
import { transformError } from "../../utils/transformError";

export const AdminTeachers = () => {
  const { user, logout } = useAuth();
  const { data: teachersData, isLoading } = useTeachers();
  const { data: classesData } = useClasses();
  const resendMutation = useResendInvite();
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const teachers = teachersData?.teachers ?? [];
  const pendingInvites = teachersData?.pendingInvites ?? [];

  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditTeacherFormData>({
    resolver: zodResolver(editTeacherSchema),
  });

  const startEditing = (t: Teacher) => {
    setEditingTeacher(t);
    resetEdit({
      name: t.name,
      formClassId: t.formClassId ?? "",
    });
  };

  const [savingEdit, setSavingEdit] = useState(false);

  const onEdit = async (formData: EditTeacherFormData) => {
    if (!editingTeacher) return;
    setSavingEdit(true);
    try {
      const { id } = editingTeacher;
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(formData)) {
        if (value !== "" && value !== undefined) payload[key] = value;
        if (key === "formClassId" && value === "") payload[key] = null;
      }
      const existing = await db.teachers.get(id);
      const merged = { ...existing, ...payload } as TeacherCache;
      await db.teachers.put(merged, id);
      await addToQueue({
        userId: user!.id,
        table: "teachers",
        recordId: id,
        endpoint: `/teachers/${id}`,
        method: "PATCH",
        payload,
      });
      toast.success("Teacher updated!");
      setEditingTeacher(null);
      resetEdit();
    } catch (err) {
      toast.error(transformError(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelEdit = () => {
    setEditingTeacher(null);
    resetEdit();
  };

  const formatExpiry = (seconds: number) => {
    if (seconds < 60) return "Expiring soon";
    const hours = Math.round(seconds / 3600);
    return `${hours}h remaining`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.schoolName}</span>
          <Avatar name={user?.name ?? ""} size={24} className="inline-block align-middle" />
          <span className="text-sm text-gray-700">{user?.name}</span>
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
            <h2 className="text-2xl font-bold text-gray-800 mt-1">Teachers</h2>
          </div>
        </div>

        {editingTeacher && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Edit Teacher — {editingTeacher.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  {...editRegister("name")}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                />
                {editErrors.name && <p className="text-xs text-destructive mt-1">{editErrors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Form Class</label>
                <select
                  {...editRegister("formClassId")}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                >
                  <option value="">None</option>
                  {classesData?.classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
                  <div key={t.id} className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.name} size={32} />
                      <div>
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
                    <button
                      onClick={() => startEditing(t)}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Edit
                    </button>
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
