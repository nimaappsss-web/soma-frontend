import { CalendarDays } from "lucide-react";

export const TimetableManagement = () => {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900">Timetable</h1>
      <p className="text-sm text-gray-400 mt-1">Create and manage class schedules</p>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 text-center">
        <CalendarDays size={32} className="mx-auto text-gray-200 mb-3" />
        <p className="text-sm text-gray-400">Timetable management coming soon</p>
        <p className="text-xs text-gray-300 mt-1">Assign subjects to periods, manage teacher schedules, and publish timetables</p>
      </div>
    </div>
  );
};
