import { useState } from "react";
import { ArrowDown2 } from "iconsax-react";
import { cn } from "@/lib/utils";
import { SomaLoader, parentLoadingDescriptions } from "../components/ui/SomaLoader";
import { useParentProfile, useChildrenWithDetails } from "../features/parent/api";
import { ParentFeesCard } from "../features/parent/components/ParentFeesCard";
import { useAllParentFees } from "../features/parent/api/useAllParentFees";
import { formatNaira } from "../features/finance/utils/currency";

const statusColor: Record<string, string> = {
  PAID: "bg-springgreen600",
  PARTIAL: "bg-amber500",
  UNPAID: "bg-red500",
};

export const ParentFees = () => {
  const { parent, isLoading } = useParentProfile();
  const children = useChildrenWithDetails(parent?.students);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBank, setShowBank] = useState(false);

  const allFees = useAllParentFees();
  const selected = children.find((c) => c.id === selectedId) ?? children[0];

  const totalFee = allFees.totalFee;
  const totalPaid = allFees.paid;
  const totalOutstanding = allFees.outstanding;
  const overallProgress = totalFee > 0 ? (totalPaid / totalFee) * 100 : 0;

  return (
    <div className="w-full px-4 pt-4 pb-16 sm:px-6 md:pt-8 md:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-5 md:mb-6">
          <h1 className="text-2xl font-bold text-gray900 md:text-3xl">School Fees</h1>
          <p className="text-sm text-gray500 mt-1">
            {children.length === 1
              ? "Fees for your child, term by term"
              : "Fees for your children, term by term"}
          </p>
        </div>

        {isLoading ? (
          <div className="py-12">
            <SomaLoader descriptions={parentLoadingDescriptions} />
          </div>
        ) : !children.length ? (
          <div className="bg-white rounded-xl p-8 border border-gray100 text-center">
            <p className="text-gray500">No children linked to your account.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary hero */}
                        <section className="rounded-2xl bg-indigo500 text-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-white/60">
                    Total left to pay for {children.length === 1 ? "your child" : `all ${children.length} children`}
                  </p>
                  <p className="text-4xl md:text-5xl font-bold mt-1 tracking-tight">
                    {formatNaira(totalOutstanding)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBank((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[11px] font-semibold text-gray900 hover:bg-gray100 shrink-0"
                >
                  View school acc
                  <ArrowDown2 size={12} color="#0D0D0D" className={cn("transition-transform", showBank && "rotate-180")} />
                </button>
              </div>

              <div className="h-1.5 bg-white/15 rounded-full overflow-hidden mt-5">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min(100, overallProgress)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-white/70">
                <span>{Math.round(overallProgress)}% paid</span>
                <span>
                  {totalFee > 0 ? `${formatNaira(totalPaid)} of ${formatNaira(totalFee)}` : "No fees set yet"}
                </span>
              </div>
              {children.length > 1 && (
                <p className="text-xs text-white/60 mt-3">
                  This is the combined total for all {children.length} children. Tap a child's name below to see their own fees.
                </p>
              )}
            </section>

            {/* Child selector */}
            {children.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible">
                {children.map((child) => {
                  const fees = allFees.summaries.find((f) => f.studentId === child.id);
                  const status = fees?.status ?? "UNPAID";
                  const active = selected?.id === child.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setSelectedId(child.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                        active
                          ? "bg-gray900 text-white border-gray900"
                          : "bg-white text-gray700 border-gray100 hover:bg-gray50",
                      )}
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          statusColor[status] ?? statusColor.UNPAID,
                        )}
                      />
                      {child.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Focused card for selected child */}
            {selected && (
              <ParentFeesCard
                key={selected.id}
                child={{
                  id: selected.id,
                  name: selected.name,
                  admissionNo: selected.admissionNo,
                  className: selected.className,
                }}
                showDetails={showBank}
                onToggleDetails={() => setShowBank((v) => !v)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
