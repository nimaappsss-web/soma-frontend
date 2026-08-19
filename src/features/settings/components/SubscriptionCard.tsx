import { Crown, Profile2User, Wallet2 } from "iconsax-react";

import { useDashboardStats } from "../../dashboard/api";
import { useAuth } from "../../../contexts/AuthContext";
import { formatNaira } from "../../finance/utils/currency";

const PRICE_PER_STUDENT_PER_TERM = 500;

export const SubscriptionCard = () => {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();

  const isAdmin = ["principal", "admin", "school_admin", "bursar"].includes(
    user?.role?.toLowerCase() ?? "",
  );
  if (!isAdmin) return null;

  const studentCount = stats?.students.total ?? 0;
  const totalPerTerm = studentCount * PRICE_PER_STUDENT_PER_TERM;
  const paidAmount = 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gray900 text-white p-6">
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-springgreen600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-springgreen600/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-springgreen600">
              <Crown size={18} color="#FFFFFF" variant="Bold" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Soma Premium</p>
              <p className="text-xs text-gray300 mt-1">{user?.schoolName ?? "Your school"}</p>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-gray300">
            Per term
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center gap-1.5">
              <Profile2User size={14} color="#34A853" variant="Bold" />
              <p className="text-[11px] text-gray300">Students</p>
            </div>
            <p className="text-3xl font-bold mt-2 leading-none">{studentCount}</p>
            <p className="text-[11px] text-gray300 mt-2">
              @ {formatNaira(PRICE_PER_STUDENT_PER_TERM)} / student
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center gap-1.5">
              <Wallet2 size={14} color="#34A853" variant="Bold" />
              <p className="text-[11px] text-gray300">This term</p>
            </div>
            <p className="text-3xl font-bold mt-2 leading-none">
              {formatNaira(totalPerTerm)}
            </p>
            <p className="text-[11px] text-gray300 mt-2">Total subscription</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray300">Paid</p>
            <p className="text-sm font-semibold">{formatNaira(paidAmount)}</p>
          </div>
          <div className="mt-2.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-springgreen600" style={{ width: "0%" }} />
          </div>
          <p className="text-[11px] text-gray300 mt-2.5">
            {paidAmount >= totalPerTerm
              ? "Subscription fully paid for this term"
              : "Subscribe to unlock all features for the term"}
          </p>
        </div>
      </div>
    </div>
  );
};