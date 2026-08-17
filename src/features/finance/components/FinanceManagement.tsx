import { useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router";

import { HelpHint, type HelpHintSection } from "../../../components/ui/HelpHint";

export { FeeStructuresTab } from "./FeeStructuresTab";
export { InvoicesTab } from "./InvoicesTab";
export { PaymentsTab } from "./PaymentsTab";
export { PendingVerificationTab } from "./PendingVerificationTab";

const VIEWS: Record<string, { title: string; subtitle: string; sections: HelpHintSection[] }> = {
  "/admin/finance": {
    title: "Overview",
    subtitle: "How much is expected, collected, and outstanding",
    sections: [
      { title: "Overview", text: "See how much is expected, collected, and outstanding across your school." },
    ],
  },
  "/admin/finance/fee-structures": {
    title: "Fee Structures",
    subtitle: "What each class owes per term",
    sections: [
      { title: "Fee Structures", text: "Define the fees each class owes per term. Parents pay against these." },
    ],
  },
  "/admin/finance/invoices": {
    title: "Invoices",
    subtitle: "Per-student invoices and who has paid",
    sections: [
      { title: "Invoices", text: "Generate per-student invoices for a class and track who has paid." },
      { title: "Reminders", text: "Send a reminder to the parents of any unpaid invoice." },
    ],
  },
  "/admin/finance/payments": {
    title: "Payments",
    subtitle: "All payments recorded against student invoices",
    sections: [
      { title: "Payments", text: "Record payments parents send. Payments must reference a transaction." },
    ],
  },
  "/admin/finance/pending": {
    title: "Pending Verification",
    subtitle: "Parent submissions waiting for your confirmation",
    sections: [
      { title: "Pending Verification", text: "Confirm or decline payments parents submitted. Only confirmed payments count." },
    ],
  },
};

export const FinanceLayout = () => {
  const location = useLocation();
  const [headerAction, setHeaderAction] = useState<ReactNode>(null);
  const view =
    VIEWS[location.pathname] ??
    VIEWS["/admin/finance"];

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-5 flex items-center justify-between">
        <div className="group flex items-center gap-2.5">
          <h1 className="text-[18px] sm:text-2xl font-semibold text-gray-900">{view.title}</h1>
          <HelpHint
            title={view.title}
            storageKey={`finance-${view.title.toLowerCase()}`}
            description={view.subtitle}
            sections={view.sections}
          />
        </div>
        {headerAction}
      </div>
      <Outlet context={{ setHeaderAction }} />
    </div>
  );
};