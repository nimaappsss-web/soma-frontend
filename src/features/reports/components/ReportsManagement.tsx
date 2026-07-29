import { FileText } from "lucide-react";

export const ReportsManagement = () => {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
      <p className="text-sm text-gray-400 mt-1">Generate and manage academic reports</p>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 text-center">
        <FileText size={32} className="mx-auto text-gray-200 mb-3" />
        <p className="text-sm text-gray-400">Reports coming soon</p>
        <p className="text-xs text-gray-300 mt-1">Generate end-of-term report cards, class performance summaries, and exportable analytics</p>
      </div>
    </div>
  );
};
