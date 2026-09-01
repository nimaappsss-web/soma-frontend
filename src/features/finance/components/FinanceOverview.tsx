import { Add, Bank, Card, ReceiptText, Wallet3 } from "iconsax-react";

import { useFinanceSummary } from "../api";
import { formatNaira } from "../utils/currency";
import { TintedStatCard } from "../../dashboard/components/TintedStatCard";
import { SomaLoader } from "../../../components/ui/SomaLoader";

const overviewLoadingDescriptions = [
  "Pulling up your finance summary…",
  "Tallying collections and outstanding fees…",
  "Just a moment…",
];

export const FinanceOverview = () => {
  const { data, isLoading } = useFinanceSummary();

  const summary = data ?? {
    totalExpected: 0,
    totalCollected: 0,
    outstanding: 0,
    collectionRate: 0,
    byClass: [],
    recentPayments: [],
  };

  const cards = [
    {
      label: "Total Expected",
      value: formatNaira(summary.totalExpected),
      icon: <Bank size={18} color="#FFFFFF" />,
      bgColor: "bg-[#FFF8E1]",
    },
    {
      label: "Total Collected",
      value: formatNaira(summary.totalCollected),
      icon: <Wallet3 size={18} color="#FFFFFF" />,
      bgColor: "bg-[#F3EDFF]",
    },
    {
      label: "Outstanding",
      value: formatNaira(summary.outstanding),
      icon: <ReceiptText size={18} color="#FFFFFF" />,
      bgColor: "bg-[#FFF0ED]",
    },
    {
      label: "Collection Rate",
      value: `${Math.round(summary.collectionRate)}%`,
      icon: <Card size={18} color="#FFFFFF" />,
      bgColor: "bg-[#EBF0FF]",
    },
  ];

  return isLoading ? (
    <div className="flex min-h-[calc(100dvh-190px)] w-full items-center justify-center rounded-3xl border border-gray100 bg-white px-6 py-14">
      <SomaLoader label="Loading overview" descriptions={overviewLoadingDescriptions} />
    </div>
  ) : (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <TintedStatCard
            key={card.label}
            label={card.label}
            value={isLoading ? "—" : card.value}
            icon={card.icon}
            bgColor={card.bgColor}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-3xl border border-gray100 p-6">
          <h3 className="text-base font-semibold text-gray900 mb-6">Collections by Class</h3>
          {summary.byClass.length === 0 ? (
            <p className="text-sm text-gray400 py-10 text-center">
              No class collections yet. Set up fee structures and generate invoices to see the breakdown.
            </p>
          ) : (
            <div className="space-y-4">
              {summary.byClass.map((row) => {
                const rate = row.expected > 0 ? (row.collected / row.expected) * 100 : 0;
                return (
                  <div key={row.className}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray900 font-medium">{row.className}</span>
                      <span className="text-gray400">
                        {formatNaira(row.collected)} / {formatNaira(row.expected)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray900 rounded-full transition-all"
                        style={{ width: `${Math.min(100, rate)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray100 p-6">
          <h3 className="text-base font-semibold text-gray900 mb-6">Recent Payments</h3>
          {summary.recentPayments.length === 0 ? (
            <div className="text-center py-10">
              <Add size={28} color="#B3B3B3" className="mx-auto mb-2" />
              <p className="text-sm text-gray400">Your School related transactions will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray100">
              {summary.recentPayments.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-gray900 font-medium">{p.studentName}</p>
                    <p className="text-xs text-gray400 mt-0.5">
                      {new Date(p.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })} · {p.method}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray900">{formatNaira(p.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};