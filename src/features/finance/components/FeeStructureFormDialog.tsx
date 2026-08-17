import { useEffect, useMemo, useRef, useState } from "react";
import { Add, CloseCircle } from "iconsax-react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { MultiSelect, type SelectOption as MultiSelectOption } from "../../../components/ui/multi-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { MoneyInput } from "./MoneyInput";
import { useCreateFeeStructure, useUpdateFeeStructure } from "../api";
import { termOptions } from "../utils/feeGroups";
import { formatNaira } from "../utils/currency";
import type { FeeItem, FeeStructure } from "../types";
import type { SelectOption } from "../../../components/ui/select-dropdown";

interface DraftItem {
  id: string;
  label: string;
  amount: number;
}

interface FormState {
  classIds: string[];
  term: string;
  session: string;
  name: string;
  items: DraftItem[];
  isCompulsory: boolean;
}

const emptyForm = (term: string, session: string): FormState => ({
  classIds: [],
  term,
  session,
  name: "",
  items: [{ id: crypto.randomUUID(), label: "", amount: 0 }],
  isCompulsory: true,
});

const toForm = (fee: FeeStructure): FormState => ({
  classIds: [],
  term: fee.term,
  session: fee.session,
  name: fee.name,
  items: fee.items?.length
    ? fee.items.map((it) => ({ id: it.id, label: it.label, amount: it.amount }))
    : [{ id: crypto.randomUUID(), label: "", amount: 0 }],
  isCompulsory: fee.isCompulsory,
});

interface FeeStructureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: FeeStructure | null;
  activeTerm: string;
  classOptions: SelectOption[];
  classIdToName: Map<string, string>;
  existingFees?: FeeStructure[];
}

export const FeeStructureFormDialog = ({
  open,
  onOpenChange,
  editing,
  activeTerm,
  classOptions,
  classIdToName,
  existingFees = [],
}: FeeStructureFormDialogProps) => {
  const createMutation = useCreateFeeStructure();
  const updateMutation = useUpdateFeeStructure();
  const labelInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const [form, setForm] = useState<FormState>(() => emptyForm(activeTerm, ""));

  useEffect(() => {
    if (open) {
      setForm(editing ? toForm(editing) : emptyForm(activeTerm, ""));
    }
  }, [open, editing, activeTerm]);

  const total = form.items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const coveredClassIds = useMemo(() => {
    const set = new Set<string>();
    for (const fee of existingFees) {
      if (fee.term === form.term && fee.id !== editing?.id) {
        for (const cid of fee.classIds ?? []) set.add(cid);
      }
    }
    return set;
  }, [existingFees, form.term, editing]);

  const multiOptions: MultiSelectOption[] = useMemo(
    () => classOptions.map((o) => ({ ...o, disabled: coveredClassIds.has(o.value) })),
    [classOptions, coveredClassIds],
  );

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const updateItem = (index: number, patch: Partial<FeeItem>) => {
    const next = form.items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    set({ items: next });
  };

  const addItem = () => {
    const id = crypto.randomUUID();
    set({ items: [...form.items, { id, label: "", amount: 0 }] });
    requestAnimationFrame(() => {
      labelInputs.current[id]?.focus();
    });
  };

  const removeItem = (index: number) => {
    set({ items: form.items.filter((_, i) => i !== index) });
  };

  const canSubmit = () => {
    const valid = form.classIds.length > 0 && !!form.term && !!form.name.trim();
    const itemsValid = form.items.length > 0 && form.items.every((it) => it.label.trim() && Number(it.amount) > 0);
    return valid && itemsValid;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    const payload = {
      classIds: form.classIds,
      term: form.term,
      session: form.session,
      name: form.name.trim(),
      isCompulsory: form.isCompulsory,
      items: form.items.map((it) => ({ id: it.id, label: it.label.trim(), amount: it.amount })),
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: { name: payload.name, isCompulsory: payload.isCompulsory, items: payload.items } },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="center" className="md:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Fee Structure" : "Add Fee Structure"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the fee name and breakdown — it updates across all linked classes."
              : "Define a fee for one or more classes. Add each charge as a line item below."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {!editing && (
            <div className="space-y-2">
              <p className="text-sm text-gray900">Classes</p>
              <MultiSelect
                options={multiOptions}
                selected={form.classIds}
                onChange={(classIds) => set({ classIds })}
                placeholder="Select classes"
                searchable
                forcePortal
              />
              {form.classIds.length > 0 && (
                <p className="text-xs text-gray-400">
                  Applies to {form.classIds.map((id) => classIdToName.get(id) ?? "Unknown").join(", ")}
                </p>
              )}
              {coveredClassIds.size > 0 && (
                <p className="text-xs text-gray-400">
                  {coveredClassIds.size} class{coveredClassIds.size === 1 ? "" : "es"} already have a fee for this term and are disabled.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray900">Term</p>
            <SelectDropdown
              options={termOptions}
              value={form.term}
              onChange={(val) => set({ term: val })}
              placeholder="Select term"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray900">Fee Name</p>
            <Input
              type="text"
              placeholder="e.g. School Fees, Tuition"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray900">Fee items</p>
              <p className="text-xs text-gray-400">Total: {formatNaira(total)}</p>
            </div>
            <div className="space-y-2">
              {form.items.map((item, index) => (
                <div key={item.id} className="rounded-xl border border-gray-100 bg-pureWhite p-2.5">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={(el) => { labelInputs.current[item.id] = el; }}
                      type="text"
                      placeholder="e.g. Tuition, PTA"
                      className="flex-1"
                      value={item.label}
                      onChange={(e) => updateItem(index, { label: e.target.value })}
                    />
                    <MoneyInput
                      className="w-24 sm:w-32 shrink-0"
                      value={item.amount}
                      onChange={(amount) => updateItem(index, { amount })}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="shrink-0 flex items-center justify-center h-11 w-11 text-gray-400 hover:text-red-500"
                      aria-label="Remove item"
                    >
                      <CloseCircle size={16} color="#8C8C8C" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="rounded-full px-3" onClick={addItem}>
              <Add size={13} color="#0D0D0D" />
              Add item
            </Button>
          </div>

          <Button
            className="w-full rounded-full"
            onClick={handleSubmit}
            disabled={!canSubmit() || isPending}
          >
            {isPending
              ? "Saving…"
              : editing
                ? "Save changes"
                : form.classIds.length > 1
                  ? `Add for ${form.classIds.length} classes`
                  : "Add fee structure"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};