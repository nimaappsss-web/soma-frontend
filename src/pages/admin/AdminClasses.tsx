import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../../contexts/AuthContext";
import {
  useClasses,
  useCreateClass,
  useDeleteClass,
} from "../../features/principal/api";
import {
  createClassSchema,
  type CreateClassFormData,
} from "../../features/principal/utils/validationSchema";

export const AdminClasses = () => {
  const { user, logout } = useAuth();
  const { data, isLoading } = useClasses();
  const createMutation = useCreateClass();
  const deleteMutation = useDeleteClass();
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClassFormData>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: "", level: "" },
  });

  const onAdd = (data: CreateClassFormData) => {
    createMutation.mutate(
      { name: data.name, level: data.level },
      {
        onSuccess: () => {
          reset();
          setShowForm(false);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.schoolName}</span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              to="/admin"
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              &larr; Dashboard
            </Link>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">Classes</h2>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Add Class
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6 flex gap-3 items-start">
            <div className="flex-1">
              <input
                {...register("name")}
                placeholder="Name (e.g. JSS 1A)"
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="w-40">
              <input
                {...register("level")}
                placeholder="Level (e.g. JSS 1)"
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
              />
              {errors.level && (
                <p className="text-xs text-destructive mt-1">
                  {errors.level.message}
                </p>
              )}
            </div>
            <button
              onClick={handleSubmit(onAdd)}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 shrink-0 h-10"
            >
              {createMutation.isPending ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-500 text-sm shrink-0 h-10"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {isLoading ? (
            <p className="text-sm text-gray-400 p-6 text-center">Loading...</p>
          ) : !data || data.classes.length === 0 ? (
            <p className="text-sm text-gray-400 p-6 text-center">
              No classes yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.classes.map((c) => (
                <div
                  key={c.id}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <span className="text-gray-800 font-medium">{c.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{c.level}</span>
                    <button
                      onClick={() => deleteMutation.mutate(c.id)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
