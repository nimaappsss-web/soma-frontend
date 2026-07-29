import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

import toast from "react-hot-toast";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { useAcademicTerms, useCreateAcademicTerm, useUpdateAcademicTerm, useSetCurrentTerm, useDeleteAcademicTerm } from "../api";
import type { CreateAcademicTermPayload, UpdateAcademicTermPayload, AcademicTerm } from "../types";

const TERM_ORDER = ["first", "second", "third"] as const;

const sessionOptions = [
  { value: "2024/2025", label: "2024/2025" },
  { value: "2025/2026", label: "2025/2026" },
  { value: "2026/2027", label: "2026/2027" },
  { value: "2027/2028", label: "2027/2028" },
];

const formatRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(s)} — ${fmt(e)}`;
};

const termLabel = (term: string) => {
  const map: Record<string, { label: string; short: string }> = {
    first: { label: "First Term", short: "I" },
    second: { label: "Second Term", short: "II" },
    third: { label: "Third Term", short: "III" },
  };
  return map[term] ?? { label: term, short: "" };
};

const toDateInputValue = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const nextDay = (dateStr: string) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const TermRow = ({
  term,
  index,
  total,
  onSetCurrent,
  onEdit,
  onDelete,
  onSetInactive,
  isPending,
  editingId,
  editForm,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit,
}: {
  term: AcademicTerm;
  index: number;
  total: number;
  onSetCurrent: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isPending: boolean;
  editingId: string | null;
  editForm: UpdateAcademicTermPayload;
  onEditFormChange: (field: keyof UpdateAcademicTermPayload, value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) => {
  const info = termLabel(term.term);
  const isEditing = editingId === term.id;

  return (
    <div className="relative flex gap-6">
      <div className="flex flex-col items-center">
        <div
          className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
            term.isCurrent
              ? "bg-gray-900 text-white ring-4 ring-green-100"
              : "bg-gray-50 text-gray-400 ring-1 ring-gray-200"
          }`}
        >
          {info.short}
        </div>
        {index < total - 1 && (
          <div className="mt-0 h-full w-px bg-gray-200" />
        )}
      </div>
      <div className={`min-w-0 flex-1 pb-10 ${index < total - 1 ? "" : "pb-0"}`}>
        <div
          className={`rounded-xl border p-5 transition-all ${
            term.isCurrent
              ? "border-green-200 bg-green-50/30"
              : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Term</span>
                <span className="text-sm font-semibold text-gray-900">{info.label}</span>
              </div>
              <SelectDropdown
                options={sessionOptions}
                value={editForm.session ?? ""}
                onChange={(v) => onEditFormChange("session", v)}
                placeholder="Session"
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <Input value={editForm.startDate ?? ""} onChange={(e) => onEditFormChange("startDate", e.target.value)} type="date" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <Input value={editForm.endDate ?? ""} onChange={(e) => onEditFormChange("endDate", e.target.value)} type="date" min={editForm.startDate || undefined} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={onSaveEdit} disabled={isPending} variant="default" size="sm">
                  Save
                </Button>
                <Button onClick={onCancelEdit} variant="ghost" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-semibold text-gray-900">{info.label}</p>
                  {term.isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{term.session}</p>
                <p className="mt-2 text-xs text-gray-400">{formatRange(term.startDate, term.endDate)}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button onClick={onEdit} variant="outline" size="sm">
                  Edit
                </Button>
                {term.isCurrent ? (
                  <Button onClick={onSetInactive} disabled={isPending} variant="outline" size="sm">
                    Set Inactive
                  </Button>
                ) : (
                  <Button onClick={onSetCurrent} disabled={isPending} variant="outline" size="sm">
                    Set Active
                  </Button>
                )}
                <Button onClick={onDelete} disabled={isPending} variant="ghost" size="sm">
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CalendarTerms = () => {
  const { data, isLoading } = useAcademicTerms();
  const createMutation = useCreateAcademicTerm();
  const updateMutation = useUpdateAcademicTerm();
  const setCurrentMutation = useSetCurrentTerm();
  const deleteMutation = useDeleteAcademicTerm();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAcademicTermPayload>({ term: "", session: "", startDate: "", endDate: "" });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateAcademicTermPayload>({});

  const terms = data?.terms ?? [];
  const hasCurrent = terms.some((t) => t.isCurrent);

  const { nextTerm, prevTerm, defaultSession } = useMemo(() => {
    const existing = new Set(terms.map((t) => t.term));
    const idx = TERM_ORDER.findIndex((t) => !existing.has(t));
    const sessions = [...new Set(terms.map((t) => t.session))].sort();
    return {
      nextTerm: idx >= 0 ? TERM_ORDER[idx] : null,
      prevTerm: idx > 0 ? terms.find((t) => t.term === TERM_ORDER[idx - 1]) : null,
      defaultSession: sessions[sessions.length - 1] ?? "",
    };
  }, [terms]);

  const minStartDate = prevTerm ? nextDay(prevTerm.endDate) : undefined;

  const openForm = () => {
    if (!nextTerm) return;
    setForm({ term: nextTerm, session: defaultSession, startDate: "", endDate: "" });
    setShowForm(true);
  };

  const handleCreate = () => {
    if (!form.term || !form.session || !form.startDate || !form.endDate) return;
    if (form.endDate <= form.startDate) { toast.error("End date must be after start date"); return; }
    createMutation.mutate(form, {
      onSuccess: () => { setShowForm(false); setForm({ term: "", session: "", startDate: "", endDate: "" }); },
    });
  };

  const startEditing = (t: AcademicTerm) => {
    setEditingId(t.id);
    setEditForm({ term: t.term, session: t.session, startDate: toDateInputValue(t.startDate), endDate: toDateInputValue(t.endDate) });
  };

  const handleEditChange = (field: keyof UpdateAcademicTermPayload, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (editForm.startDate && editForm.endDate && editForm.endDate <= editForm.startDate) {
      toast.error("End date must be after start date");
      return;
    }
    const data = Object.fromEntries(
      Object.entries(editForm).filter(([_, v]) => v !== undefined && v !== ""),
    ) as UpdateAcademicTermPayload;
    if (Object.keys(data).length === 0) return;
    updateMutation.mutate({ id: editingId, data }, {
      onSuccess: () => setEditingId(null),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const isPending = createMutation.isPending || updateMutation.isPending || setCurrentMutation.isPending || deleteMutation.isPending;

  return (
    <div className="max-w-2xl">
      <div className="mb-10">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-1">Academic Calendar</p>
        <h1 className="text-2xl font-semibold text-gray-900">Terms</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-md">
          Define the terms that make up your school year and choose which one is currently active.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-medium text-gray-900">Term Schedule</p>
          {nextTerm && (
            <Button onClick={openForm} variant="outline" size="sm">
              Set up {termLabel(nextTerm).label}
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showForm && nextTerm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5"
            >
              <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Term</span>
                  <span className="text-sm font-semibold text-gray-900">{termLabel(nextTerm).label}</span>
                </div>
                <SelectDropdown
                  options={sessionOptions}
                  value={form.session}
                  onChange={(v) => setForm({ ...form, session: v })}
                  placeholder="Session"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <Input
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      type="date"
                      min={minStartDate}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <Input
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      type="date"
                      min={form.startDate || minStartDate}
                    />
                  </div>
                </div>
                {prevTerm && (
                  <p className="text-xs text-gray-400">
                    Must start after {formatRange(prevTerm.startDate, prevTerm.endDate)}
                  </p>
                )}
                <Button onClick={handleCreate} disabled={isPending} className="w-full">
                  {createMutation.isPending ? "Adding..." : `Add ${termLabel(nextTerm).label}`}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-6">
              <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-28" />
                <div className="h-4 bg-gray-100 rounded w-20" />
                <div className="h-3 bg-gray-100 rounded w-36" />
              </div>
            </div>
          ))}
        </div>
      ) : terms.length > 0 ? (
        <div className="relative">
          {terms.map((t, i) => (
            <TermRow
              key={t.id}
              term={t}
              index={i}
              total={terms.length}
              onSetCurrent={() => setCurrentMutation.mutate(t.id)}
              onSetInactive={() => updateMutation.mutate({ id: t.id, data: { isCurrent: false } })}
              onEdit={() => startEditing(t)}
              onDelete={() => deleteMutation.mutate(t.id)}
              isPending={isPending}
              editingId={editingId}
              editForm={editForm}
              onEditFormChange={handleEditChange}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400">No terms yet</p>
          <p className="text-xs text-gray-300 mt-1">
            {nextTerm ? `Click "Set up ${termLabel(nextTerm).label}" to get started.` : "All terms are set up."}
          </p>
        </div>
      )}

      {terms.length > 0 && !hasCurrent && (
        <p className="mt-6 text-xs text-gray-400 text-center">
          No term is currently active — set one using the button above.
        </p>
      )}

      {!nextTerm && terms.length > 0 && (
        <p className="mt-4 text-xs text-gray-400 text-center">
          All three terms have been set up.
        </p>
      )}
    </div>
  );
};
