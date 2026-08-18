import { forwardRef } from "react";
import { Printer } from "iconsax-react";

import { Button } from "@/components/ui/button";
import { formatNaira } from "../utils/currency";
import { termLabel } from "../../calendar/utils/term";
import type { InvoiceDetail } from "../types";

interface InvoiceViewProps {
  invoice: InvoiceDetail;
  onClose?: () => void;
}

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

export const InvoiceView = forwardRef<HTMLDivElement, InvoiceViewProps>(({ invoice, onClose }, ref) => {
  const { student, school, signatory } = invoice;
  const address = [school.address, school.lga, school.state].filter(Boolean).join(", ");

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2 no-print pr-6">
        <p className="text-sm font-medium text-gray900">Invoice</p>
        <div className="flex gap-2">
          {onClose && (
            <Button variant="outline" size="sm" className="rounded-full px-4" onClick={onClose}>
              Close
            </Button>
          )}
          <Button size="sm" className="rounded-full px-4" onClick={() => window.print()}>
            <Printer size={14} color="#FFFFFF" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      <div ref={ref} className="print-area relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 md:p-8">
        <div
          className="print-bg pointer-events-none absolute inset-0 bg-no-repeat bg-center"
          style={{
            backgroundImage: "url(/somaBg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.1,
          }}
        />

        {invoice.status === "PAID" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] pointer-events-none z-10">
            <div className="border-4 border-springgreen600 rounded-xl px-6 py-3 bg-springgreen600/10">
              <p className="text-3xl font-black text-springgreen600 uppercase tracking-wider">Paid</p>
            </div>
          </div>
        )}

        <div className="relative">
          {/* Letterhead */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3 min-w-0">
              {school.logo ? (
                <img src={school.logo} alt="" className="h-12 w-12 rounded-full object-contain bg-gray-50" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-lg font-bold text-gray-900">
                  {school.name?.charAt(0) ?? "S"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray900 leading-tight">{school.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{address || "Nigeria"}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400">Invoice #{invoice.id.slice(0, 10).toUpperCase()}</p>
              <p className="text-sm font-semibold text-gray900 mt-0.5">Fee Invoice</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(invoice.createdAt)}</p>
            </div>
          </div>

          {/* Bill to */}
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Bill to</p>
              <p className="text-sm font-semibold text-gray900 mt-1">{student.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">Admission No: {student.admissionNo || "—"}</p>
              <p className="text-xs text-gray-400 mt-0.5">Class: {student.className || "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Term / Session</p>
              <p className="text-sm font-semibold text-gray900 mt-1">{termLabel(invoice.term).label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{invoice.session}</p>
            </div>
          </div>

          {/* Items */}
          <div className="mt-6">
            <div className="flex items-center justify-between rounded-t-lg bg-black px-4 py-2.5">
              <p className="text-xs font-semibold text-white uppercase tracking-wide">Fee items</p>
              <p className="text-xs font-semibold text-white uppercase tracking-wide">{invoice.feeName}</p>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {(invoice.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-4 text-gray900">{item.label}</td>
                    <td className="py-2.5 px-4 text-right text-gray900">{formatNaira(item.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-pureWhite">
                  <td className="py-3 px-4 text-sm font-bold text-gray900">Total</td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-gray900">{formatNaira(invoice.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatory */}
          <div className="flex items-end justify-between mt-10">
            <div className="max-w-[240px]">
              <p className="text-xs text-gray-400">School fee structure</p>
              <p className="text-xs text-gray-400 mt-0.5">Term: {termLabel(invoice.term).label} · {invoice.session}</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-200 pb-1.5 px-6">
                <p className="text-sm font-semibold text-gray900 whitespace-nowrap">{signatory.name}</p>
              </div>
              <p className="text-xs text-gray-400 mt-1">{signatory.title}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
InvoiceView.displayName = "InvoiceView";