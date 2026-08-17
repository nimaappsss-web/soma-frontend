import { useState } from "react";
import { Add, CalendarRemove, Edit, Trash } from "iconsax-react";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { DateInput } from "../../../components/ui/date-input";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useHolidays, useCreateHoliday, useUpdateHoliday, useDeleteHoliday } from "../api";
import type { CreateHolidayPayload, UpdateHolidayPayload } from "../types";

const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

const toDateInput = (d: string) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const CalendarHolidays = () => {
  const today = new Date();
  const from = `${today.getFullYear()}-01-01`;
  const to = `${today.getFullYear()}-12-31`;

  const { data, isLoading } = useHolidays({ from, to });
  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateHolidayPayload>({ date: "", reason: "" });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateHolidayPayload>({});

  const holidays = data?.holidays ?? [];
  const sorted = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleCreate = () => {
    if (!form.date || !form.reason) return;
    createMutation.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ date: "", reason: "" }); } });
  };

  const startEditing = (id: string, date: string, reason: string) => {
    setEditingId(id);
    setEditForm({ date: toDateInput(date), reason });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const data = Object.fromEntries(
      Object.entries(editForm).filter(([_, v]) => v !== undefined && v !== ""),
    ) as UpdateHolidayPayload;
    if (Object.keys(data).length === 0) return;
    updateMutation.mutate({ id: editingId, data }, {
      onSuccess: () => { setEditingId(null); setEditForm({}); },
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm">
          {showForm ? "Cancel" : "Add Holiday"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-3">
          <DateInput
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v })}
          />
          <Input
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Reason (e.g. Democracy Day)"
          />
          <button onClick={handleCreate} disabled={isPending} className="w-full">
            {createMutation.isPending ? "Adding..." : "Mark as Holiday"}
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((h) => (
            <div key={h.id} className="bg-white rounded-xl border border-gray-100 p-4">
              {editingId === h.id ? (
                <div className="space-y-3">
                  <DateInput
                    value={editForm.date ?? ""}
                    onChange={(v) => setEditForm({ ...editForm, date: v })}
                  />
                  <Input
                    value={editForm.reason ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    placeholder="Reason"
                  />
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} disabled={isPending} variant="default" size="sm">Save</Button>
                    <Button onClick={cancelEdit} variant="ghost" size="sm">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(h.date)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{h.reason}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditing(h.id, h.date, h.reason)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit size={16} variant="Bold" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(h.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash size={16} variant="Bold" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarRemove size={30} variant="Bold" color="#0D0D0D" />}
          title="No holidays marked for this year"
          description="Mark school holidays so the calendar reflects days off for the whole school."
          actionLabel="Add Holiday"
          actionIcon={<Add size={16} color="#FFFFFF" variant="Linear" />}
          onAction={() => setShowForm(true)}
        />
      )}
    </div>
  );
};
