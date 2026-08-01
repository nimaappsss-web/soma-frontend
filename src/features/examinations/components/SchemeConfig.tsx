import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { CalendarTick, Add, Copy, Trash, Edit } from "iconsax-react";

import { useExamComponents } from "../api/useExamComponents";
import { useCreateExamComponent } from "../api/useCreateExamComponent";
import { useUpdateExamComponent } from "../api/useUpdateExamComponent";
import { useDeleteExamComponent } from "../api/useDeleteExamComponent";
import { useCopyExamComponents } from "../api/useCopyExamComponents";
import { useActiveTerm } from "../../calendar/api";
import { termLabel } from "../../calendar/utils/term";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { cn } from "../../../lib/utils";
import type {
  ExamComponent,
  ExamComponentType,
  CreateExamComponentPayload,
  UpdateExamComponentPayload,
} from "../types";

const TYPE_OPTIONS: { value: ExamComponentType; label: string }[] = [
  { value: "TEST", label: "Test" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "PROJECT", label: "Project" },
  { value: "PRACTICAL", label: "Practical" },
  { value: "EXAM", label: "Exam" },
  { value: "PHYSICAL", label: "Physical" },
  { value: "OTHER", label: "Other" },
];

const typePill = (type: ExamComponentType) => {
  switch (type) {
    case "EXAM":
      return "bg-springgreen600/10 text-springgreen600";
    case "TEST":
      return "bg-azure500/10 text-azure500";
    case "ASSIGNMENT":
      return "bg-amber500/10 text-amber500";
    default:
      return "bg-gray100 text-gray700";
  }
};

interface ComponentFormState {
  name: string;
  type: ExamComponentType;
  maxScore: string;
}

const EMPTY_FORM: ComponentFormState = { name: "", type: "TEST", maxScore: "" };

export const SchemeConfig = () => {
  const { activeTerm, terms } = useActiveTerm();
  const [term, setTerm] = useState<string>(activeTerm?.term ?? "");

  const termOptions = useMemo(
    () => terms.map((t) => ({ value: t.term, label: termLabel(t.term).label })),
    [terms],
  );

  useEffect(() => {
    if (activeTerm?.term && (!term || !termOptions.some((o) => o.value === term))) {
      setTerm(activeTerm.term);
    }
  }, [activeTerm?.term, term, termOptions]);

  const { data, isLoading } = useExamComponents(term);
  const createMutation = useCreateExamComponent();
  const updateMutation = useUpdateExamComponent();
  const deleteMutation = useDeleteExamComponent();
  const copyMutation = useCopyExamComponents();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ComponentFormState>(EMPTY_FORM);

  const components = data?.components ?? [];
  const schemeTotal = data?.schemeTotal ?? 0;
  const complete = data?.complete ?? false;
  const warning = data?.warning ?? null;

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type: components.length ? "EXAM" : "TEST" });
    setDialogOpen(true);
  };

  const openEdit = (c: ExamComponent) => {
    setEditingId(c.id);
    setForm({ name: c.name, type: c.type, maxScore: String(c.maxScore) });
    setDialogOpen(true);
  };

  const remaining = 100 - schemeTotal;
  const formMaxScore = Number(form.maxScore);
  const editingComponent = editingId ? components.find((c) => c.id === editingId) ?? null : null;
  const maxAllowable = editingComponent ? editingComponent.maxScore + remaining : remaining;
  const exceedsScheme = Number.isFinite(formMaxScore) && formMaxScore > maxAllowable;

  const handleSubmit = () => {
    const maxScore = Number(form.maxScore);
    if (!form.name.trim() || !Number.isFinite(maxScore) || maxScore <= 0) return;
    if (maxScore > maxAllowable) {
      toast.error(`Max score of ${maxScore} exceeds the remaining ${maxAllowable} marks.`);
      return;
    }

    if (editingId) {
      const data: UpdateExamComponentPayload = { name: form.name.trim(), type: form.type, maxScore };
      updateMutation.mutate(
        { id: editingId, data },
        { onSuccess: () => { setDialogOpen(false); setForm(EMPTY_FORM); } },
      );
      return;
    }

    const payload: CreateExamComponentPayload = {
      term,
      name: form.name.trim(),
      type: form.type,
      maxScore,
      sortOrder: components.length + 1,
    };
    createMutation.mutate(payload, {
      onSuccess: () => { setDialogOpen(false); setForm(EMPTY_FORM); },
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || copyMutation.isPending;

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray900">Configure CA &amp; Scores</h1>
          <p className="text-xs md:text-sm text-gray500 mt-0.5">
            One score scheme per term, shared across all subjects.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {terms.length === 0 ? (
            <p className="text-xs text-gray500 sm:text-right sm:max-w-[220px]">
              Set up terms in Calendar → Terms to configure a score scheme.
            </p>
          ) : (
            <>
              <SelectDropdown
                options={termOptions}
                value={term}
                onChange={setTerm}
                buttonClassName="w-full sm:w-40"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyMutation.mutate({ term })}
                disabled={isPending || components.length > 0}
              >
                <Copy variant="Linear" size={14} color="currentColor" />
                Copy previous scheme
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray100">
              <CalendarTick size={20} variant="Bold" color="#0D0D0D" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray900">
                Scheme total: <span className={complete ? "text-springgreen600" : "text-amber500"}>{schemeTotal} / 100</span>
              </p>
              <p className="text-xs text-gray500">
                {complete ? "Ready — all 100 marks accounted for." : (warning ?? "Scores should add up to 100.")}
              </p>
            </div>
          </div>
          <span className={cn("shrink-0 rounded-full px-3 py-1 text-[11px] font-medium", complete ? "bg-springgreen600/10 text-springgreen600" : "bg-amber500/10 text-amber500")}>
            {complete ? "Complete" : "Incomplete"}
          </span>
        </div>
        <div className="h-2 bg-gray100 rounded-full overflow-hidden mt-4">
          <div
            className={cn("h-full rounded-full transition-all", complete ? "bg-springgreen600" : "bg-amber500")}
            style={{ width: `${Math.min(100, schemeTotal)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray900">Components</p>
        <Button size="sm" onClick={openAdd} disabled={isPending || remaining <= 0}>
          <Add size={14} variant="Linear" color="#FFFFFF" />
          Add component
        </Button>
      </div>
      {remaining <= 0 && components.length > 0 && (
        <p className="mt-2 text-xs text-springgreen600">Scheme is full — all 100 marks are accounted for.</p>
      )}

      <div className="mt-3 space-y-2">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
          </div>
        ) : components.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray100 p-8 text-center">
            <p className="text-sm font-medium text-gray900">No components configured</p>
            <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
              Add your CA and exam components (e.g. Test 1 = 20, Test 2 = 20, Exam = 60) until the scheme totals 100.
            </p>
          </div>
        ) : (
          components.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray100 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray100 text-sm font-bold text-gray900">
                {c.sortOrder}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray900 truncate">{c.name}</p>
                <span className={cn("inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium", typePill(c.type))}>
                  {c.type}
                </span>
              </div>
              <span className="shrink-0 text-sm font-bold text-gray900">{c.maxScore}</span>
              <span className="shrink-0 text-xs text-gray500">marks</span>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full shrink-0"
                  onClick={() => openEdit(c)}
                  aria-label="Edit"
                >
                  <Edit size={14} variant="Linear" color="#0D0D0D" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-full shrink-0"
                  onClick={() => deleteMutation.mutate(c.id)}
                  disabled={isPending}
                  aria-label="Delete"
                >
                  <Trash size={14} variant="Linear" color="#CD432F" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent variant="middle">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit component" : "Add component"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the name, type, or max score." : "Add a CA or exam component to the scheme."}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="component-name">Name</Label>
              <Input
                id="component-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Test 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <SelectDropdown
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v as ExamComponentType })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="component-max">Max score</Label>
              <Input
                id="component-max"
                type="number"
                min={1}
                value={form.maxScore}
                onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                placeholder={`Up to ${maxAllowable}`}
                aria-invalid={exceedsScheme}
              />
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-xs", exceedsScheme ? "text-red500" : "text-gray500")}>
                  {editingComponent
                    ? `${editingComponent.maxScore} currently · ${remaining} marks remaining`
                    : `${remaining} marks remaining in the scheme`}
                </p>
                {exceedsScheme && (
                  <p className="text-xs font-medium text-red500">Exceeds remaining by {formMaxScore - maxAllowable}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="w-full" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!form.name.trim() || !Number.isFinite(Number(form.maxScore)) || Number(form.maxScore) <= 0 || exceedsScheme || isPending}
              >
                {isPending ? "Saving..." : editingId ? "Save changes" : "Add component"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
