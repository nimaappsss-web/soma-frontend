import { ClipboardCheck } from "lucide-react";

export const AttendanceOverview = () => {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>
      <p className="text-sm text-gray-400 mt-1">View attendance records across all classes</p>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 text-center">
        <ClipboardCheck size={32} className="mx-auto text-gray-200 mb-3" />
        <p className="text-sm text-gray-400">Attendance overview coming soon</p>
        <p className="text-xs text-gray-300 mt-1">View daily attendance summaries, class-wise reports, and student attendance history</p>
      </div>
    </div>
  );
};
