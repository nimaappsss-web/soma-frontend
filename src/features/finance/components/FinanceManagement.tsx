import { HelpHint } from "../../../components/ui/HelpHint";

export const FinanceManagement = () => {
  return (
    <div className="p-6 w-full">
      <div className="group flex items-center gap-2.5">
        <h1 className="text-xl md:text-2xl font-bold text-gray900">Finance</h1>
        <HelpHint
          title="Finance"
          storageKey="finance"
          description="Manage school finances."
          sections={[
            { title: "What's here", text: "This is where school finances will live once enabled." },
            { title: "Coming soon", text: "Fee collections, invoices, and payments are on the way." },
          ]}
        />
      </div>
      <p className="text-sm text-gray-400 mt-1">Manage school finances</p>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 text-center">
        <p className="text-sm text-gray-400">Finance management coming soon</p>
      </div>
    </div>
  );
};
