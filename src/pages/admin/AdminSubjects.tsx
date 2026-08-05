import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar } from "../../components/ui/Avatar";
import { Input } from "../../components/ui/input";
import { DuplicateConfirmDialog } from "../../components/others/DuplicateConfirmDialog";
import { useAuth } from "../../contexts/AuthContext";
import { useSubjects, useCreateSubject, useDeleteSubject } from "../../features/principal/api";
import { createSubjectSchema, type CreateSubjectFormData } from "../../features/principal/utils/validationSchema";
import { namesMatch } from "../../utils/dedupe";
interface SubjectPayload {
  name: string;
  code?: string;
}
export const AdminSubjects = () => {
  const { user, logout } = useAuth();
  const { data: subjects, isLoading } = useSubjects();
  const createMutation = useCreateSubject();
  const deleteMutation = useDeleteSubject();
  const [showForm, setShowForm] = useState(false);
  const [dupState, setDupState] = useState<{ payload: SubjectPayload; match: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSubjectFormData>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: "", code: "" },
  });
  const onAdd = (data: CreateSubjectFormData) => {
    const payload: SubjectPayload = { name: data.name, code: data.code || undefined };
    const existing = (subjects ?? []).find((s) => namesMatch(s.name, data.name));
    if (existing) {
      setDupState({ payload, match: existing.name });
      return;
    }
    createMutation.mutate(payload, {
      onSuccess: () => { reset(); setShowForm(false); },
    });
  };
  const confirmAdd = () => {
    if (!dupState) return;
    createMutation.mutate(dupState.payload, {
      onSuccess: () => { reset(); setShowForm(false); setDupState(null); },
    });
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-500">{user?.schoolName}</span>
          <Avatar name={user?.name ?? ""} size={24} className="inline-block align-middle" />
          <span className="text-sm text-gray-700">{user?.name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
            {user?.role}
          </span>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">Sign out</button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600">&larr; Dashboard</Link>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">Subjects</h2>
          </div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Add Subject
          </button>
        </div>
        {showForm && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-3 items-start">
            <div className="flex-1">
              <Input
                {...register("name")}
                placeholder="Subject name"
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div className="w-full md:w-40">
              <Input
                {...register("code")}
                placeholder="Code (optional)"
              />
            </div>
            <button onClick={handleSubmit(onAdd)} disabled={createMutation.isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 shrink-0 h-10 w-full md:w-auto">
              {createMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 text-sm shrink-0 h-10 w-full md:w-auto">Cancel</button>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {isLoading ? (
            <p className="text-sm text-gray-400 p-6 text-center">Loading...</p>
          ) : !subjects || subjects.length === 0 ? (
            <p className="text-sm text-gray-400 p-6 text-center">No subjects yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {subjects.map((s) => (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                  <span className="text-gray-800 font-medium">{s.name}</span>
                  <div className="flex items-center gap-3">
                    {s.code && <span className="text-xs text-gray-400">{s.code}</span>}
                    <button onClick={() => deleteMutation.mutate(s.id)} className="text-xs text-red-500 hover:text-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <DuplicateConfirmDialog
        open={!!dupState}
        onOpenChange={(open) => { if (!open) setDupState(null); }}
        title="Subject already exists"
        description={dupState ? `"${dupState.payload.name}" is already a subject in your school.` : ""}
        highlight="Adding it again will create a duplicate subject."
        confirmLabel="Add anyway"
        onConfirm={confirmAdd}
      >
        {dupState && (
          <div className="rounded-lg border border-gray100 bg-gray50 px-3 py-2 text-sm">
            <span className="font-medium text-gray900">{dupState.match}</span>
          </div>
        )}
      </DuplicateConfirmDialog>
    </div>
  );
};
