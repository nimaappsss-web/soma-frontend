import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { toast } from "@/utils/toast";
import { CalendarTick, Add, Trash, Edit, Setting2, Warning2 } from "iconsax-react";

import { useExamSchemes } from "../api/useExamSchemes";
import { useCreateExamComponent } from "../api/useCreateExamComponent";
import { useUpdateExamComponent } from "../api/useUpdateExamComponent";
import { useDeleteExamComponent } from "../api/useDeleteExamComponent";
import { useDeleteExamScheme } from "../api/useDeleteExamScheme";
import { useCreateExamScheme } from "../api/useCreateExamScheme";
import { useUpdateExamScheme } from "../api/useUpdateExamScheme";
import { useClasses } from "../../principal/api/useClasses";
import { useSchoolSettings } from "../../settings/api/useSchoolSettings";
import { useActiveTerm } from "../../calendar/api";
import { HelpHint } from "../../../components/ui/HelpHint";
import { termLabel } from "../../calendar/utils/term";
import { schoolTypeLabel } from "../../../utils/schoolType";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { MultiSelect } from "../../../components/ui/multi-select";
import { cn } from "../../../lib/utils";
import type {
  ExamComponent,
  ExamComponentType,
  ExamSchemeInfo,
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

const typeLabel = (t: string) => schoolTypeLabel(t);

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

interface ScopeState {
  mode: "create" | "edit";
  scheme: ExamSchemeInfo | null;
}

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

  const { data, isLoading } = useExamSchemes(term);
  const { data: classesData } = useClasses();
  const { data: settings } = useSchoolSettings();

  const schemes = data?.schemes ?? [];

  const createComponentMutation = useCreateExamComponent();
  const updateComponentMutation = useUpdateExamComponent();
  const deleteComponentMutation = useDeleteExamComponent();
  const deleteSchemeMutation = useDeleteExamScheme();
  const createSchemeMutation = useCreateExamScheme();
  const updateSchemeMutation = useUpdateExamScheme();

  const schoolTypes = useMemo(() => {
    const st = settings?.find((s) => s.key === "schoolType");
    return Array.isArray(st?.value) ? (st.value as string[]) : [];
  }, [settings]);

  const classCountByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of classesData?.classes ?? []) {
      if (!c.schoolType) continue;
      map.set(c.schoolType, (map.get(c.schoolType) ?? 0) + 1);
    }
    return map;
  }, [classesData]);

  const availableTypes = useMemo(() => {
    const set = new Set<string>(schoolTypes);
    for (const t of classCountByType.keys()) set.add(t);
    return [...set].sort();
  }, [schoolTypes, classCountByType]);

  const coveredTypes = useMemo(() => {
    const set = new Set<string>();
    for (const s of schemes) for (const t of s.schoolTypes) set.add(t);
    return set;
  }, [schemes]);

  const uncoveredTypes = useMemo(
    () => availableTypes.filter((t) => !coveredTypes.has(t)),
    [availableTypes, coveredTypes],
  );

  const [componentDialog, setComponentDialog] = useState<ExamSchemeInfo | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ComponentFormState>(EMPTY_FORM);

  const [scopeDialog, setScopeDialog] = useState<ScopeState | null>(null);
  const [selectedScope, setSelectedScope] = useState<string[]>([]);

  const [deleteScheme, setDeleteScheme] = useState<ExamSchemeInfo | null>(null);

  const isPending =
    createComponentMutation.isPending ||
    updateComponentMutation.isPending ||
    deleteComponentMutation.isPending ||
    deleteSchemeMutation.isPending ||
    createSchemeMutation.isPending ||
    updateSchemeMutation.isPending;

  const openAddComponent = (scheme: ExamSchemeInfo) => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type: scheme.components.length ? "EXAM" : "TEST" });
    setComponentDialog(scheme);
  };

  const openEditComponent = (scheme: ExamSchemeInfo, c: ExamComponent) => {
    setEditingId(c.id);
    setForm({ name: c.name, type: c.type, maxScore: String(c.maxScore) });
    setComponentDialog(scheme);
  };

  const openCreateScope = () => {
    setSelectedScope(uncoveredTypes);
    setScopeDialog({ mode: "create", scheme: null });
  };

  const openEditScope = (scheme: ExamSchemeInfo) => {
    setSelectedScope(scheme.schoolTypes);
    setScopeDialog({ mode: "edit", scheme });
  };

  const scopeOptions = useMemo(() => {
    if (!scopeDialog) return [];
    const base = scopeDialog.mode === "edit" && scopeDialog.scheme
      ? availableTypes.filter(
          (t) => !coveredTypes.has(t) || scopeDialog.scheme!.schoolTypes.includes(t),
        )
      : availableTypes.filter((t) => !coveredTypes.has(t));
    return base.map((t) => ({ value: t, label: typeLabel(t) }));
  }, [scopeDialog, availableTypes, coveredTypes]);

  const remaining = componentDialog ? 100 - componentDialog.schemeTotal : 0;
  const formMaxScore = Number(form.maxScore);
  const editingComponent = componentDialog && editingId
    ? componentDialog.components.find((c) => c.id === editingId) ?? null
    : null;
  const maxAllowable = editingComponent ? editingComponent.maxScore + remaining : remaining;
  const exceedsScheme = Number.isFinite(formMaxScore) && formMaxScore > maxAllowable;

  const handleComponentSubmit = () => {
    if (!componentDialog) return;
    const maxScore = Number(form.maxScore);
    if (!form.name.trim() || !Number.isFinite(maxScore) || maxScore <= 0) return;
    if (maxScore > maxAllowable) {
      toast.error(`Max score of ${maxScore} exceeds the remaining ${maxAllowable} marks.`);
      return;
    }

    if (editingId) {
      const payload: UpdateExamComponentPayload = { name: form.name.trim(), type: form.type, maxScore };
      updateComponentMutation.mutate(
        { id: editingId, data: payload, term },
        { onSuccess: () => { setComponentDialog(null); setForm(EMPTY_FORM); } },
      );
      return;
    }

    const payload: CreateExamComponentPayload = {
      term,
      name: form.name.trim(),
      type: form.type,
      maxScore,
      sortOrder: componentDialog.components.length + 1,
      schemeId: componentDialog.schemeId!,
    };
    createComponentMutation.mutate(payload, {
      onSuccess: () => { setComponentDialog(null); setForm(EMPTY_FORM); },
    });
  };

  const handleScopeSubmit = () => {
    if (!scopeDialog) return;
    if (selectedScope.length === 0) {
      toast.error("Pick at least one school type.");
      return;
    }
    if (scopeDialog.mode === "create") {
      createSchemeMutation.mutate(
        { term, schoolTypes: selectedScope },
        { onSuccess: () => setScopeDialog(null) },
      );
    } else if (scopeDialog.scheme?.schemeId) {
      updateSchemeMutation.mutate(
        { id: scopeDialog.scheme.schemeId, schoolTypes: selectedScope, term },
        { onSuccess: () => setScopeDialog(null) },
      );
    }
  };

  const handleDeleteScheme = () => {
    if (!deleteScheme?.schemeId) return;
    deleteSchemeMutation.mutate(
      { id: deleteScheme.schemeId, term },
      { onSuccess: () => setDeleteScheme(null) },
    );
  };

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <div className="group flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-gray900">Configure CA &amp; Scores</h1>
            <HelpHint
              title="Configure CA &amp; Scores"
              storageKey="scheme-config"
              description="Set the CA and exam scheme for each school type and term."
              sections={[
                { title: "Pick a term", text: "Choose which term you're configuring, then add a configuration for a school type." },
                { title: "Add components", text: "Each configuration holds CA tests and exams — name them, set max scores, and weights." },
                { title: "Auto-applied", text: "Every class of the chosen type automatically follows its configuration when marking." },
                { title: "Manage", text: "Edit or delete components and configurations anytime. Changes apply going forward." },
              ]}
            />
          </div>
          <p className="text-xs md:text-sm text-gray500 mt-0.5">
            Each configuration applies to a school type — every class of that type automatically follows it.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {terms.length === 0 ? null : (
            <>
              <SelectDropdown
                options={termOptions}
                value={term}
                onChange={setTerm}
                buttonClassName="w-full sm:w-40"
              />
              <Button onClick={openCreateScope} disabled={isPending}>
                <Add variant="Linear" size={14} color="#FFFFFF" />
                New configuration
              </Button>
            </>
          )}
        </div>
      </div>

      {terms.length === 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber500/30 bg-amber500/5 px-4 py-4">
          <Warning2 size={18} variant="Bold" color="#B45309" className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray900">No academic terms configured</p>
            <p className="text-xs text-gray500 mt-1">
              You need to create at least one term before you can configure CA &amp; exam score schemes.
            </p>
            <Link
              to="/admin/calendar/terms"
              className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-medium text-gray900 underline underline-offset-2 hover:text-gray600 transition-colors"
            >
              <CalendarTick size={13} color="#0D0D0D" />
              Go to Calendar → Terms
            </Link>
          </div>
        </div>
      )}

      {uncoveredTypes.length > 0 && schemes.length > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber500/30 bg-amber500/5 px-4 py-3">
          <Warning2 size={16} variant="Bold" color="#B45309" className="shrink-0 mt-0.5" />
          <p className="text-sm text-gray700">
            <span className="font-medium">Uncovered:</span>{" "}
            {uncoveredTypes.map((t) => `${typeLabel(t)} (${classCountByType.get(t) ?? 0} classes)`).join(", ")}{" "}
            — create a configuration for these school types so their classes can be scored.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray100 border-t-gray900 mx-auto" />
        </div>
      ) : terms.length === 0 ? null : schemes.length === 0 ? (
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray100">
            <CalendarTick size={22} variant="Bold" color="#0D0D0D" />
          </div>
          <p className="text-sm font-medium text-gray900 mt-3">No configurations for this term</p>
          <p className="text-xs text-gray500 mt-1 max-w-sm mx-auto">
            Create a configuration for a school type (e.g. Secondary, or Creche + Primary together), then add the CA
            and exam components until the scheme totals 100.
          </p>
          <Button size="sm" className="mt-4" onClick={openCreateScope} disabled={isPending}>
            <Add size={14} variant="Linear" color="#FFFFFF" />
            New configuration
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {schemes.map((scheme) => (
            <div key={scheme.schemeId} className="bg-white rounded-xl border border-gray100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray100">
                    <CalendarTick size={20} variant="Bold" color="#0D0D0D" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {scheme.schoolTypes.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-gray100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-gray700"
                        >
                          {typeLabel(t)}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray500 mt-1">
                      {scheme.schoolTypes.reduce((sum, t) => sum + (classCountByType.get(t) ?? 0), 0)} classes covered
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-medium",
                      scheme.complete ? "bg-springgreen600/10 text-springgreen600" : "bg-amber500/10 text-amber500",
                    )}
                  >
                    {scheme.complete ? "Complete" : "Incomplete"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => openEditScope(scheme)}
                    disabled={isPending}
                    aria-label="Edit which school types this configuration covers"
                  >
                    <Setting2 size={14} variant="Linear" color="#0D0D0D" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setDeleteScheme(scheme)}
                    disabled={isPending}
                    aria-label="Delete configuration"
                  >
                    <Trash size={14} variant="Linear" color="#CD432F" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray900">
                  Scheme total:{" "}
                  <span className={scheme.complete ? "text-springgreen600" : "text-amber500"}>
                    {scheme.schemeTotal} / 100
                  </span>
                </p>
                <p className="text-xs text-gray500 text-right">
                  {scheme.complete
                    ? "Ready — all 100 marks accounted for."
                    : (scheme.warning ?? "Scores should add up to 100.")}
                </p>
              </div>
              <div className="h-2 bg-gray100 rounded-full overflow-hidden mt-2">
                <div
                  className={cn("h-full rounded-full transition-all", scheme.complete ? "bg-springgreen600" : "bg-amber500")}
                  style={{ width: `${Math.min(100, scheme.schemeTotal)}%` }}
                />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray900">Components</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openAddComponent(scheme)}
                    disabled={isPending || 100 - scheme.schemeTotal <= 0}
                  >
                    <Add size={14} variant="Linear" color="currentColor" />
                    Add component
                  </Button>
                </div>
                {100 - scheme.schemeTotal <= 0 && scheme.components.length > 0 && (
                  <p className="mt-1 text-xs text-springgreen600">This configuration is full — all 100 marks accounted for.</p>
                )}
              </div>

              <div className="mt-2 space-y-2">
                {scheme.components.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray200 px-4 py-5 text-center">
                    <p className="text-xs text-gray500">
                      No components yet. Add e.g. Test 1 = 20, Test 2 = 20, Exam = 60.
                    </p>
                  </div>
                ) : (
                  scheme.components.map((c) => (
                    <div key={c.id} className="rounded-xl border border-gray100 p-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray100 text-sm font-bold text-gray900">
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
                          onClick={() => openEditComponent(scheme, c)}
                          aria-label="Edit component"
                        >
                          <Edit size={14} variant="Linear" color="#0D0D0D" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-full shrink-0"
                          onClick={() => deleteComponentMutation.mutate({ id: c.id, term })}
                          disabled={isPending}
                          aria-label="Delete component"
                        >
                          <Trash size={14} variant="Linear" color="#CD432F" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={componentDialog !== null} onOpenChange={(o) => { if (!o) { setComponentDialog(null); setForm(EMPTY_FORM); } }}>
        <DialogContent variant="middle">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit component" : "Add component"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the name, type, or max score."
                : componentDialog
                  ? `Add a CA or exam component to the ${componentDialog.schoolTypes.map(typeLabel).join(", ")} configuration.`
                  : ""}
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
                    : `${remaining} marks remaining in this configuration`}
                </p>
                {exceedsScheme && (
                  <p className="text-xs font-medium text-red500">Exceeds remaining by {formMaxScore - maxAllowable}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="w-full" onClick={() => setComponentDialog(null)}>
                Cancel
              </Button>
              <Button
                className="w-full"
                onClick={handleComponentSubmit}
                disabled={!form.name.trim() || !Number.isFinite(Number(form.maxScore)) || Number(form.maxScore) <= 0 || exceedsScheme || isPending}
              >
                {isPending ? "Saving..." : editingId ? "Save changes" : "Add component"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={scopeDialog !== null} onOpenChange={(o) => { if (!o) setScopeDialog(null); }}>
        <DialogContent variant="middle">
          <DialogHeader>
            <DialogTitle>{scopeDialog?.mode === "edit" ? "Edit configuration scope" : "New configuration"}</DialogTitle>
            <DialogDescription>
              {scopeDialog?.mode === "edit"
                ? "Pick which school types this configuration applies to. Every class of those types will follow it."
                : "Pick the school types this configuration applies to. Every class of those types will follow it."}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <Label>School types</Label>
              <MultiSelect
                options={scopeOptions}
                selected={selectedScope}
                onChange={setSelectedScope}
                placeholder="Select school types"
                searchable
              />
              {scopeOptions.length === 0 && (
                <p className="text-xs text-amber500">
                  All available school types are already covered by other configurations. Edit an existing one instead.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedScope.map((t) => (
                <span key={t} className="rounded-full bg-gray100 px-2.5 py-1 text-[11px] font-medium text-gray700">
                  {typeLabel(t)} · {classCountByType.get(t) ?? 0} classes
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="w-full" onClick={() => setScopeDialog(null)}>
                Cancel
              </Button>
              <Button
                className="w-full"
                onClick={handleScopeSubmit}
                disabled={selectedScope.length === 0 || isPending}
              >
                {isPending ? "Saving..." : scopeDialog?.mode === "edit" ? "Save changes" : "Create configuration"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteScheme !== null} onOpenChange={(o) => { if (!o) setDeleteScheme(null); }}>
        <DialogContent variant="middle">
          <DialogHeader>
            <DialogTitle>Delete this configuration?</DialogTitle>
            <DialogDescription>
              This removes the configuration
              {deleteScheme && deleteScheme.schoolTypes.length > 0 ? ` for ${deleteScheme.schoolTypes.map(typeLabel).join(", ")}` : ""}
              {deleteScheme && deleteScheme.components.length > 0
                ? ` and its ${deleteScheme.components.length} component${deleteScheme.components.length === 1 ? "" : "s"}`
                : ""}
              . Linked assessments will keep their scores but lose the mark-type reference. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 px-6 pb-6">
            <Button variant="outline" className="w-full" onClick={() => setDeleteScheme(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDeleteScheme}
              disabled={deleteSchemeMutation.isPending}
            >
              {deleteSchemeMutation.isPending ? "Deleting..." : "Delete configuration"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
