import { useState, useEffect, useRef } from "react";
import { ArrowDown2, Copy, Card } from "iconsax-react";

import { cn } from "@/lib/utils";
import { SomaLoader, feesLoadingDescriptions } from "../../../components/ui/SomaLoader";
import { Button } from "../../../components/ui/button";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { useActiveTerm } from "../../calendar/api";
import { termLabel } from "../../calendar/utils/term";
import { formatNaira } from "../../finance/utils/currency";
import { useParentFees, usePaystackEnabled } from "../api";
import type { ParentTermFees } from "../api/useParentFees";
import { useClipboard } from "../../../hooks/useClipboard";
import { PaymentSubmitModal } from "./PaymentSubmitModal";
import { PaymentReceiptModal } from "./PaymentReceiptModal";
import { PaystackModal } from "./PaystackModal";
import { InvoiceView } from "../../finance/components/InvoiceView";
import { useInvoiceDetail } from "../../finance/api";
import type { Payment } from "../../finance/types";
import { useSchoolSettings } from "../../settings/api";
import type { ManualBankDetails } from "../../settings/types";

const statusStyles: Record<ParentTermFees["status"], string> = {
  PAID: "bg-green-50 text-green-600",
  PARTIAL: "bg-amber-50 text-amber-600",
  UNPAID: "bg-gray-50 text-gray-500",
};

const statusLabel: Record<ParentTermFees["status"], string> = {
  PAID: "Paid",
  PARTIAL: "Part paid",
  UNPAID: "Not paid yet",
};

const payStatusLabel: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmed ✓", className: "bg-green-50 text-green-600" },
  PENDING: { label: "Waiting for the school", className: "bg-blue-50 text-azure500" },
  REJECTED: { label: "Not accepted", className: "bg-red-50 text-red-500" },
};

interface Props {
  child: { id: string; name: string; admissionNo: string; className?: string };
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export const ParentFeesCard = ({ child, showDetails: showDetailsProp, onToggleDetails }: Props) => {
  const [showDetails, setShowDetails] = useState(false);
  const detailsOpen = showDetailsProp ?? showDetails;
  const toggleDetails = () => {
    if (onToggleDetails) onToggleDetails();
    else setShowDetails((v) => !v);
  };
  const detailsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (detailsOpen) {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [detailsOpen]);
  const { terms, isLoading } = useParentFees(child.id);
  const { activeTerm } = useActiveTerm();
  const [term, setTerm] = useState<string>(activeTerm?.term ?? "first");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [paystackOpen, setPaystackOpen] = useState(false);
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const { data: invoiceDetail, isLoading: invoiceLoading } = useInvoiceDetail(viewInvoiceId ?? "");
  const { copy, copied } = useClipboard();
  const paystackEnabled = usePaystackEnabled();
  const { data: settings } = useSchoolSettings();
  const bankSetting = settings?.find((s) => s.key === "manualBankDetails");
  const bank = (bankSetting?.value as ManualBankDetails | null) ?? null;

  const active = terms.find((t) => t.term === term) ?? terms[0];
  const progress = active && active.totalFee > 0 ? (active.paid / active.totalFee) * 100 : 0;
  const breakdownItems = active?.invoices[0]?.items ?? [];

  const availableTerms = terms.filter((t) => t.totalFee > 0 || t.history.length > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray100 overflow-hidden">
      {/* Child header */}
      <div className="px-4 py-4 md:px-6 border-b border-gray50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray900 text-white flex items-center justify-center text-base font-medium shrink-0">
          {child.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray900 truncate">{child.name}</h3>
          <p className="text-xs text-gray500 mt-0.5 truncate">
            {child.admissionNo}
            {child.className ? ` · ${child.className}` : ""}
          </p>
        </div>
      </div>

      <div className="px-4 py-4 md:px-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray900">School Fees</p>
          {availableTerms.length > 1 && (
            <div className="flex gap-1">
              {availableTerms.map((t) => (
                <button
                  key={t.term}
                  type="button"
                  onClick={() => setTerm(t.term)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    term === t.term ? "bg-gray900 text-white" : "bg-gray50 text-gray500 hover:bg-accent",
                  )}
                >
                  {termLabel(t.term).label}
                </button>
              ))}
            </div>
          )}
        </div>

      {isLoading ? (
        <SomaLoader label="Loading fees" descriptions={feesLoadingDescriptions} className="h-8 w-8" />
      ) : !active || active.totalFee <= 0 ? (
        <p className="text-sm text-gray-400 py-3">
          No fee set up for {termLabel(term).label.toLowerCase()} yet.
        </p>
      ) : (
        <div>
          <div className="rounded-xl border border-gray-100 bg-pureWhite p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Fee for {termLabel(term).label.toLowerCase()}</p>
                <p className="text-lg font-bold text-gray900 mt-0.5">{formatNaira(active.totalFee)}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", statusStyles[active.status])}>
                  {statusLabel[active.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-400">Paid so far</p>
                <p className="text-sm font-semibold text-springgreen600 mt-0.5">{formatNaira(active.paid)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Still to pay</p>
                <p className="text-2xl font-bold text-gray900 mt-0.5">{formatNaira(active.outstanding)}</p>
              </div>
            </div>

            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-black rounded-full transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{Math.round(progress)}% paid</p>

            <Button className="w-full rounded-full mt-4" onClick={() => setSubmitOpen(true)} disabled={active.outstanding <= 0}>
              Pay {formatNaira(active.outstanding)}
            </Button>
            {paystackEnabled && (
              <Button
                variant="outline"
                className="w-full rounded-full mt-2"
                onClick={() => setPaystackOpen(true)}
                disabled={active.outstanding <= 0}
              >
                <Card size={15} color="#0D0D0D" />
                Pay now with card
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full rounded-full mt-2 border-black text-black hover:bg-black hover:text-white"
              onClick={() => setViewInvoiceId(active.invoices[0].id)}
            >
              View invoice
            </Button>
            {breakdownItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBreakdown((v) => !v)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray900 mt-3"
              >
                <ArrowDown2 size={12} color="#8C8C8C" className={cn("transition-transform", showBreakdown && "rotate-180")} />
                See what this covers
              </button>
            )}
            {showBreakdown && breakdownItems.length > 0 && (
              <div className="mt-2 border-t border-gray-50 pt-2">
                <div className="flex flex-col gap-1.5">
                  {breakdownItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <p className="text-gray500">{item.label}</p>
                      <p className="font-medium text-gray900">{formatNaira(item.amount)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs pt-2 mt-1 border-t border-gray-50">
                  <p className="font-semibold text-gray900">Total</p>
                  <p className="font-bold text-gray900">{formatNaira(active.totalFee)}</p>
                </div>
              </div>
            )}
          </div>

          {active.history.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray900 mb-2">What you've paid</p>
              <div className="divide-y divide-gray-50">
                {active.history.map((p) => {
                  const ps = payStatusLabel[p.status];
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2.5">
                      <button
                        type="button"
                        onClick={() => p.status === "CONFIRMED" && setReceipt(p)}
                        className={cn(
                          "min-w-0 text-left",
                          p.status === "CONFIRMED" && "cursor-pointer",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray900">{formatNaira(p.amount)}</p>
                          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", ps.className)}>
                            {ps.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {p.submittedAt
                            ? new Date(p.submittedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                          {p.reference ? ` · ${p.reference.slice(0, 12)}…` : ""}
                        </p>
                        {p.status === "REJECTED" && p.rejectedReason && (
                          <p className="text-xs text-red-500 mt-0.5">{p.rejectedReason}</p>
                        )}
                      </button>
                      {p.reference && (
                        <button
                          type="button"
                          onClick={() => copy(p.reference!)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray900 shrink-0 ml-2"
                        >
                          <Copy size={12} color={copied ? "#34A853" : "#8C8C8C"} />
                          {copied ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

<button
              type="button"
              onClick={toggleDetails}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray900 mt-3"
            >
              <ArrowDown2 size={12} color="#8C8C8C" className={cn("transition-transform", detailsOpen && "rotate-180")} />
              Transfer details & reference code
            </button>
          {detailsOpen && (
            <div ref={detailsRef} className="rounded-xl border border-gray-100 bg-pureWhite p-4 mt-2">
              {bank?.accountNumber && (
                <>
                  <p className="text-base font-semibold text-indigo500">School account</p>
                  <div className="mt-2.5 space-y-2.5">
                    {bank.accountName && (
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wide">Account name</p>
                        <p className="text-sm font-semibold text-gray900 mt-0.5">{bank.accountName}</p>
                      </div>
                    )}
                    {bank.bankName && (
                      <div>
                        <p className="text-[11px] text-gray-400 uppercase tracking-wide">Bank</p>
                        <p className="text-sm font-semibold text-gray900 mt-0.5">{bank.bankName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide">Account number</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-base font-bold text-gray900 tracking-widest">{bank.accountNumber}</p>
                        <button
                          type="button"
                          onClick={() => copy(bank.accountNumber!)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray900 shrink-0"
                        >
                          <Copy size={12} color={copied ? "#34A853" : "#8C8C8C"} />
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <div className={cn("mt-3 pt-3", bank?.accountNumber && "border-t border-gray-50")}>
                <p className="text-xs text-gray-400">Child's reference code</p>
                <p className="text-2xl font-bold text-gray900 tracking-wide mt-1">{child.admissionNo || "—"}</p>
                <p className="text-xs text-gray-400 mt-3">
                  {bank?.accountNumber
                    ? "Transfer the amount to the account above, then tell the school your child's name and reference code. They will confirm it for you."
                    : "If you prefer, transfer the fee to the school's account and tell the school your child's name and reference code. They will confirm it for you."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {active && active.outstanding > 0 && (
        <PaymentSubmitModal
          open={submitOpen}
          onOpenChange={setSubmitOpen}
          childName={child.name}
          invoice={{
            id: active.invoices[0].id,
            studentId: child.id,
            outstanding: active.outstanding,
            amount: active.totalFee,
            feeName: active.invoices[0].feeName ?? "School fees",
          }}
        />
      )}

      {receipt && (
        <PaymentReceiptModal
          payment={receipt}
          childName={child.name}
          open={!!receipt}
          onOpenChange={(o) => !o && setReceipt(null)}
        />
      )}

      {active && active.outstanding > 0 && paystackEnabled && (
        <PaystackModal
          open={paystackOpen}
          onOpenChange={setPaystackOpen}
          childName={child.name}
          invoice={{
            id: active.invoices[0].id,
            studentId: child.id,
            studentName: child.name,
            admissionNo: child.admissionNo,
            feeName: active.invoices[0].feeName ?? "School fees",
            amount: active.totalFee,
            status: active.status,
            dueDate: active.invoices[0].dueDate ?? null,
            createdAt: active.invoices[0].createdAt,
            outstanding: active.outstanding,
          }}
        />
      )}

      <Dialog open={!!viewInvoiceId} onOpenChange={(o) => !o && setViewInvoiceId(null)}>
        <DialogContent variant="center" className="md:max-w-2xl">
          {invoiceLoading ? (
            <div className="py-10">
              <SomaLoader label="Loading invoice" descriptions={feesLoadingDescriptions} className="h-8 w-8" />
            </div>
          ) : invoiceDetail?.invoice ? (
            <InvoiceView invoice={invoiceDetail.invoice} onClose={() => setViewInvoiceId(null)} />
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">Couldn't load this invoice.</div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};