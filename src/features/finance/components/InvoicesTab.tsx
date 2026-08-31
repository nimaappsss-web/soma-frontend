import { useEffect, useState, type ReactNode } from "react";
import { ReceiptText, DocumentDownload, Send2, Eye, Filter } from "iconsax-react";
import { useOutletContext } from "react-router";

import { cn } from "@/lib/utils";
import { Button } from "../../../components/ui/button";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { MultiSelect } from "../../../components/ui/multi-select";
import { BottomSheet } from "../../../components/mobile/BottomSheet";
import { CollapsibleCard } from "../../../components/mobile/CollapsibleCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { useInvoices, useBulkGenerateInvoices, useSendPaymentReminder, useInvoiceDetail } from "../api";
import { useClasses } from "../../principal/api";
import { useActiveTerm } from "../../calendar/api";
import { termLabel } from "../../calendar/utils/term";
import { formatNaira } from "../utils/currency";
import { InvoiceView } from "./InvoiceView";
import type { InvoiceStatus } from "../types";

const statusOptions = [
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIAL", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
];

const statusStyles: Record<InvoiceStatus, string> = {
  UNPAID: "bg-gray-50 text-gray-500",
  PARTIAL: "bg-amber-50 text-amber-600",
  PAID: "bg-green-50 text-green-600",
};

const statusLabel: Record<InvoiceStatus, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
};

export const InvoicesTab = () => {
  const { data: classesData } = useClasses();
  const { activeTerm } = useActiveTerm();
  const { setHeaderAction } = useOutletContext<{ setHeaderAction: (node: ReactNode) => void }>();
  const bulkMutation = useBulkGenerateInvoices();
  const reminderMutation = useSendPaymentReminder();

  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkClassId, setBulkClassId] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);
  const { data: detailData, isLoading: detailLoading } = useInvoiceDetail(viewId ?? "");

  const classes = classesData?.classes ?? [];
  const classOptions = [{ value: "", label: "All classes" }, ...classes.map((c) => ({ value: c.id, label: c.name }))];

  const { data, isLoading } = useInvoices({ classId: classId || undefined, status: status.length > 0 ? status as InvoiceStatus[] : undefined });
  const invoices = data?.invoices ?? [];
  const hasFilters = !!classId || status.length > 0;

  useEffect(() => {
    setHeaderAction(
      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-2.5">
          <SelectDropdown
            options={classOptions}
            value={classId}
            onChange={setClassId}
            placeholder="Filter by class"
            searchable
            buttonClassName="h-10 text-sm"
            menuClassName="min-w-[180px]"
          />
          <MultiSelect
            options={statusOptions}
            selected={status}
            onChange={setStatus}
            placeholder="Filter by status"
            className="min-w-[180px]"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setClassId(""); setStatus([]); }}
              className="text-sm font-medium text-gray-500 hover:text-gray900 underline underline-offset-4 shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="flex md:hidden h-[44px] w-[44px] items-center justify-center rounded-[15px] border border-input bg-background shrink-0"
          aria-label="Filters"
        >
          <Filter size={16} color="#0D0D0D" variant="Linear" />
        </button>

        <button
          type="button"
          onClick={() => setBulkOpen(true)}
          className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-gray900 px-4 text-sm font-medium text-white hover:bg-gray800"
        >
          <DocumentDownload size={15} color="#FFFFFF" />
          Generate Invoices
        </button>
      </div>,
    );
    return () => setHeaderAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHeaderAction, classId, status, hasFilters, classOptions.length]);

  const handleBulk = () => {
    if (!bulkClassId || !activeTerm) return;
    bulkMutation.mutate(
      { classId: bulkClassId, term: activeTerm.term },
      {
        onSuccess: () => {
          setBulkOpen(false);
          setBulkClassId("");
        },
      },
    );
  };

  return (
    <div>
      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
        <div className="space-y-4">
          <SelectDropdown
            options={classOptions}
            value={classId}
            onChange={setClassId}
            placeholder="Filter by class"
            searchable
            buttonClassName="h-10 text-sm"
            menuClassName="min-w-[200px]"
          />
          <MultiSelect
            options={statusOptions}
            selected={status}
            onChange={setStatus}
            placeholder="Filter by status"
            className="min-w-full"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setClassId(""); setStatus([]); }}
              className="w-full rounded-full border border-input py-3 text-sm font-medium text-gray900"
            >
              Clear filters
            </button>
          )}
        </div>
      </BottomSheet>

      {!isLoading && invoices.length === 0 ? (
        <EmptyState
          icon={<ReceiptText color="#0D0D0D" />}
          title={hasFilters ? "No invoices match your filters" : "No invoices yet"}
          description={
            hasFilters
              ? "Try clearing the filters to see all invoices."
              : "Generate invoices for a class to start collecting fees."
          }
          actionLabel={hasFilters ? undefined : "Generate Invoices"}
          onAction={hasFilters ? undefined : () => setBulkOpen(true)}
          actionIcon={<DocumentDownload size={15} />}
        />
      ) : (
        <>
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <ReceiptText size={16} variant="Bold" color="#0D0D0D" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray900 truncate">{inv.studentName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {inv.feeName} · {inv.admissionNo}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", statusStyles[inv.status])}>
                  {statusLabel[inv.status]}
                </span>
                <p className="text-sm font-semibold text-gray900 w-24 text-right">{formatNaira(inv.amount)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-3"
                  onClick={() => setViewId(inv.id)}
                >
                  <Eye size={13} color="#8C8C8C" />
                  View
                </Button>
                {inv.status !== "PAID" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full px-3"
                    onClick={() => reminderMutation.mutate({ invoiceId: inv.id })}
                    disabled={reminderMutation.isPending}
                  >
                    <Send2 size={13} color="#8C8C8C" />
                    Remind
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="md:hidden space-y-3.5">
          {invoices.map((inv) => (
            <CollapsibleCard
              key={inv.id}
              collapsed={
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center shrink-0">
                    <ReceiptText size={19} variant="Bold" color="#0D0D0D" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[15px] font-semibold text-gray900 leading-snug truncate">
                        {inv.studentName}
                      </p>
                      <span className={cn("shrink-0 text-xs font-medium px-2.5 py-1 rounded-full", statusStyles[inv.status])}>
                        {statusLabel[inv.status]}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray900 mt-1">
                      {formatNaira(inv.amount)}
                    </p>
                  </div>
                </div>
              }
              expanded={
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-gray-400">Fee</p>
                      <p className="text-[13px] font-medium text-gray-700 mt-0.5 break-words leading-snug">
                        {inv.feeName || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-gray-400">Admission No</p>
                      <p className="text-[13px] font-medium text-gray-700 mt-0.5 break-words leading-snug">
                        {inv.admissionNo || "—"}
                      </p>
                    </div>
                  </div>

                  {(inv.term || inv.session) && (
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-gray-400">Term / Session</p>
                      <p className="text-[13px] font-medium text-gray-700 mt-0.5">
                        {[inv.term ? termLabel(inv.term).label : undefined, inv.session]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <Button
                      variant="outline"
                      className="h-[46px] rounded-full px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewId(inv.id);
                      }}
                    >
                      <Eye size={16} color="#8C8C8C" />
                      View
                    </Button>
                    {inv.status !== "PAID" ? (
                      <Button
                        className="h-[46px] rounded-full px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          reminderMutation.mutate({ invoiceId: inv.id });
                        }}
                        disabled={reminderMutation.isPending}
                      >
                        <Send2 size={16} color="#FFFFFF" />
                        Remind
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-[46px] rounded-full px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewId(inv.id);
                        }}
                      >
                        <Eye size={16} color="#8C8C8C" />
                        Details
                      </Button>
                    )}
                  </div>
                </div>
              }
            />
          ))}
        </div>
        </>
      )}

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent variant="center" className="md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Invoices for Class</DialogTitle>
            <DialogDescription>
              {activeTerm
                ? `Create an invoice for every active student in the class for ${termLabel(activeTerm.term).label}, based on their fee structures.`
                : "Create invoices for every active student in the class based on their fee structures."}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray900">Class</p>
              <SelectDropdown
                options={classOptions}
                value={bulkClassId}
                onChange={setBulkClassId}
                placeholder="Select class"
                searchable
              />
            </div>

            <div className="rounded-xl bg-gray50 px-4 py-3">
              <p className="text-xs text-gray-400">
                An invoice will be created for every active student in the class, based on their fee
                structure, and parents will be able to see it.
              </p>
            </div>

            <Button className="w-full rounded-full" onClick={handleBulk} disabled={!bulkClassId || bulkMutation.isPending}>
              {bulkMutation.isPending ? "Generating…" : "Generate Invoices"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View invoice */}
      <Dialog open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
        <DialogContent variant="center" className="md:max-w-2xl">
          {detailLoading ? (
            <div className="py-10">
              <SomaLoader label="Loading invoice" className="h-8 w-8" />
            </div>
          ) : detailData?.invoice ? (
            <InvoiceView invoice={detailData.invoice} onClose={() => setViewId(null)} />
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">Couldn't load this invoice.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};