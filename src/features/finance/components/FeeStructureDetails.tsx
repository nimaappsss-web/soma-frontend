import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft2, Wallet3, Edit2, ExportSquare, Trash, Building, Medal } from "iconsax-react";

import { Button } from "../../../components/ui/button";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { useFeeStructures, useDeleteFeeStructure, useBulkGenerateInvoices } from "../api";
import { useClasses } from "../../principal/api";
import { useActiveTerm } from "../../calendar/api";
import { termLabel } from "../../calendar/utils/term";
import { schoolTypeLabel } from "../../../utils/schoolType";
import { formatNaira } from "../utils/currency";
import { FeeStructureFormDialog } from "./FeeStructureFormDialog";
import { groupFees } from "../utils/feeGroups";

export const FeeStructureDetails = () => {
  const { groupId = "" } = useParams<{ groupId: string }>();
  const { data, isLoading } = useFeeStructures();
  const { data: classesData } = useClasses();
  const { activeTerm } = useActiveTerm();
  const deleteMutation = useDeleteFeeStructure();
  const generateMutation = useBulkGenerateInvoices();

  const [editOpen, setEditOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const classMap = useMemo(() => new Map((classesData?.classes ?? []).map((c) => [c.id, c])), [classesData]);
  const classIdToName = useMemo(() => new Map((classesData?.classes ?? []).map((c) => [c.id, c.name])), [classesData]);
  const classOptions = useMemo(
    () => (classesData?.classes ?? []).map((c) => ({ value: c.id, label: c.name })),
    [classesData],
  );

  const groups = useMemo(() => groupFees(data?.feeStructures ?? [], classMap), [data, classMap]);
  const group = groups.find((g) => g.groupId === groupId);

  const isPending = deleteMutation.isPending || generateMutation.isPending;

  const handleGenerate = () => {
    if (!group) return;
    generateMutation.mutate({ classIds: group.classIds, term: group.term });
    setGenerating(false);
  };

  const handleDelete = () => {
    if (!group) return;
    deleteMutation.mutate(group.sample.id, {
      onSuccess: () => setDeleting(false),
    });
  };

  if (isLoading && !group) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="py-24">
          <SomaLoader label="Loading fee structure" className="h-8 w-8" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="mt-4 bg-white rounded-xl border border-gray100 p-10 text-center">
          <p className="text-sm text-gray-500">Could not load this fee structure.</p>
          <p className="mt-1 text-xs text-gray-400">It may have been deleted or you may be offline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header */}
      <div className="relative bg-white rounded-xl border border-gray100 p-5">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/finance/fee-structures"
            aria-label="Back to Fee Structures"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray50 text-gray500 transition-colors hover:bg-gray100 hover:text-gray900"
          >
            <ArrowLeft2 variant="Linear" size={16} color="#0D0D0D" />
          </Link>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray900 text-white">
            <Wallet3 size={26} color="#FFFFFF" variant="Bold" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{group.name}</h1>
            <p className="mt-0.5 break-words text-sm text-gray-400 leading-snug">
              {termLabel(group.term).label} · {group.session}
            </p>
          </div>
          <div className="hidden md:block text-right shrink-0">
            <p className="text-lg font-bold text-gray-900">{formatNaira(group.amount)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{group.isCompulsory ? "Compulsory" : "Optional"}</p>
          </div>
        </div>
        <div className="md:hidden mt-4 flex items-end justify-between gap-3 border-t border-gray-50 pt-3">
          <p className="text-xs text-gray-400">{group.isCompulsory ? "Compulsory fee" : "Optional fee"}</p>
          <p className="text-xl font-bold text-gray-900">{formatNaira(group.amount)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" className="rounded-full px-3" onClick={() => setGenerating(true)}>
          <ExportSquare size={13} color="#FFFFFF" />
          Generate invoices
        </Button>
        <Button variant="outline" size="sm" className="rounded-full px-3" onClick={() => setEditOpen(true)}>
          <Edit2 size={13} color="#0D0D0D" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full px-3 ml-auto text-red-500 hover:text-red-600"
          onClick={() => setDeleting(true)}
        >
          <Trash size={13} color="#CD432F" />
          Delete
        </Button>
      </div>

      {/* Fee breakdown */}
      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">What it covers</h2>
          <p className="text-xs text-gray-400">{group.items.length} item{group.items.length === 1 ? "" : "s"}</p>
        </div>
        <div className="space-y-2">
          {(group.items ?? []).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray100 px-4 py-3">
              <p className="text-sm text-gray-900">{item.label}</p>
              <p className="text-sm font-semibold text-gray-900 shrink-0">{formatNaira(item.amount)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 rounded-lg bg-gray900 px-4 py-3">
            <p className="text-sm font-medium text-gray-300">Total</p>
            <p className="text-sm font-bold text-white">{formatNaira(group.amount)}</p>
          </div>
        </div>
      </div>

      {/* Classes */}
      <div className="mt-4 bg-white rounded-xl border border-gray100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Classes this applies to</h2>
          <p className="text-xs text-gray-400">{group.classIds.length} class{group.classIds.length === 1 ? "" : "es"}</p>
        </div>
        <div className="space-y-2">
          {group.classIds.map((classId) => {
            const cls = classMap.get(classId);
            return (
              <div key={classId} className="flex items-center justify-between gap-3 rounded-lg border border-gray100 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray100 text-gray500">
                    <Building size={16} color="#8C8C8C" />
                  </div>
                  <p className="break-words text-sm font-medium text-gray-900 leading-snug">{classIdToName.get(classId) ?? "Unknown class"}</p>
                </div>
                {cls?.schoolType && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gray50 px-2.5 py-1 text-xs text-gray500">
                    <Medal size={12} color="#8C8C8C" />
                    {schoolTypeLabel(cls.schoolType)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <FeeStructureFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={group.sample}
        activeTerm={activeTerm?.term ?? "first"}
        classOptions={classOptions}
        classIdToName={classIdToName}
        existingFees={data?.feeStructures ?? []}
      />

      {/* Generate confirmation */}
      <Dialog open={generating} onOpenChange={setGenerating}>
        <DialogContent variant="center" className="md:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate invoices?</DialogTitle>
            <DialogDescription>
              This would send this to the parents and they'd be able to see it — an invoice for every active student in{" "}
              {group.classIds.length} class{group.classIds.length === 1 ? "" : "es"} for{" "}
              {termLabel(group.term).label} will be created.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-2">
            <div className="rounded-xl bg-gray50 px-4 py-3">
              <p className="text-xs text-gray-400">Fee</p>
              <p className="text-sm font-semibold text-gray-900">{group.name}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{formatNaira(group.amount)}</p>
            </div>
            <Button className="w-full rounded-full" onClick={handleGenerate} disabled={isPending}>
              {generateMutation.isPending ? "Generating…" : "Yes, generate invoices"}
            </Button>
            <Button variant="ghost" className="w-full rounded-full" onClick={() => setGenerating(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent variant="center" className="md:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete fee structure?</DialogTitle>
            <DialogDescription>
              This permanently removes “{group.name}” and any invoices generated from it. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 flex gap-2">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleting(false)}>
              Cancel
            </Button>
            <Button className="flex-1 rounded-full bg-red-500 hover:bg-red-600" onClick={handleDelete} disabled={isPending}>
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};