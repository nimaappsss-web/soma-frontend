import { useState, useMemo } from "react";

import toast from "react-hot-toast";
import { Add, CalendarTick } from "iconsax-react";
import { DateInput } from "../../../components/ui/date-input";
import { Button } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { useAcademicTerms, useCreateAcademicTerm, useUpdateAcademicTerm, useDeleteAcademicTerm } from "../api";
import { isDateInRange } from "../utils/term";
import type { CreateAcademicTermPayload, UpdateAcademicTermPayload, AcademicTerm } from "../types";

const TERM_ORDER = ["first", "second", "third"] as const;

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
  isActive,
  onEdit,
  onDelete,
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
  isActive: boolean;
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
            isActive
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
            isActive
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
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <DateInput className="w-full" value={editForm.startDate ?? ""} onChange={(v) => onEditFormChange("startDate", v)} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <DateInput className="w-full" value={editForm.endDate ?? ""} onChange={(v) => onEditFormChange("endDate", v)} min={editForm.startDate || undefined} />
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
                  {isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{termLabel(term.term).label}</p>
                <p className="mt-2 text-xs text-gray-400">{formatRange(term.startDate, term.endDate)}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button onClick={onEdit} variant="outline" size="sm">
                  Edit
                </Button>
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
  const deleteMutation = useDeleteAcademicTerm();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAcademicTermPayload>({ term: "", startDate: "", endDate: "" });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateAcademicTermPayload>({});

  const terms = data?.terms ?? [];
  const activeTermId = useMemo(() => {
    const today = new Date();
    const byDate = terms.find((t) => isDateInRange(t.startDate, t.endDate, today));
    if (byDate) return byDate.id;
    const flagged = terms.find((t) => t.isCurrent);
    return flagged?.id ?? null;
  }, [terms]);
  const hasCurrent = activeTermId !== null;

  const { nextTerm, prevTerm } = useMemo(() => {
    const existing = new Set(terms.map((t) => t.term));
    const idx = TERM_ORDER.findIndex((t) => !existing.has(t));
    return {
      nextTerm: idx >= 0 ? TERM_ORDER[idx] : null,
      prevTerm: idx > 0 ? terms.find((t) => t.term === TERM_ORDER[idx - 1]) : null,
    };
  }, [terms]);

  const minStartDate = prevTerm ? nextDay(prevTerm.endDate) : undefined;

  const openForm = () => {
    if (!nextTerm) return;
    setForm({ term: nextTerm, startDate: "", endDate: "" });
    setShowForm(true);
  };

  const handleCreate = () => {
    if (!form.term || !form.startDate || !form.endDate) return;
    if (form.endDate <= form.startDate) { toast.error("End date must be after start date"); return; }
    createMutation.mutate(form, {
      onSuccess: () => { setShowForm(false); setForm({ term: "", startDate: "", endDate: "" }); },
    });
  };

  const startEditing = (t: AcademicTerm) => {
    setEditingId(t.id);
    setEditForm({ term: t.term, startDate: toDateInputValue(t.startDate), endDate: toDateInputValue(t.endDate) });
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

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">Term Schedule</p>
        {nextTerm && (
          <Button onClick={openForm}>
            <Add size={14} color="#FFFFFF" />
            Set up {termLabel(nextTerm).label}
          </Button>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) setForm({ term: "", startDate: "", endDate: "" }); setShowForm(open); }}>
        <DialogContent variant="middle" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up {nextTerm ? termLabel(nextTerm).label : ""}</DialogTitle>
            <DialogDescription>
              Choose the start and end dates for this term.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Term</span>
              <span className="text-sm font-semibold text-gray-900">{nextTerm ? termLabel(nextTerm).label : ""}</span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <DateInput
                  className="w-full"
                  value={form.startDate}
                  onChange={(v) => setForm({ ...form, startDate: v })}
                  min={minStartDate}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <DateInput
                  className="w-full"
                  value={form.endDate}
                  onChange={(v) => setForm({ ...form, endDate: v })}
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
              {createMutation.isPending ? "Adding..." : `Add ${termLabel(nextTerm ?? "first").label}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              isActive={t.id === activeTermId}
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
        <EmptyState
          className="min-h-[calc(100dvh-240px)]"
          icon={<CalendarTick size={30} variant="Bold" color="#0D0D0D" />}
          title="Set up your school year"
          description="Add the First, Second and Third term dates so attendance, scores and reports run smoothly across your session."
          actionLabel={nextTerm ? `Set up ${termLabel(nextTerm).label}` : "Set up your school year"}
          actionIcon={<Add size={16} color="#FFFFFF" variant="Linear" />}
          onAction={openForm}
        />
      )}

      {terms.length > 0 && !hasCurrent && (
        <p className="mt-6 text-xs text-gray-400 text-center">
          No term is flagged active on the server — the current term is detected automatically from the dates above.
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
