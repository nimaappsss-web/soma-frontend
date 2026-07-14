import type { Student } from "../../../features/students/types";
import type { AttendanceStatus } from "../types";

interface AttendanceListViewProps {
  students: Student[];
  attendance: Record<string, AttendanceStatus>;
  onMark: (studentId: string, status: AttendanceStatus) => void;
}

const statusIcons: Record<AttendanceStatus, { icon: string; active: string; inactive: string }> = {
  present: {
    icon: "✓",
    active: "bg-green-100 text-green-600 ring-2 ring-green-500",
    inactive: "text-gray-300 hover:text-green-500 hover:bg-green-50",
  },
  absent: {
    icon: "✕",
    active: "bg-red-100 text-red-600 ring-2 ring-red-500",
    inactive: "text-gray-300 hover:text-red-500 hover:bg-red-50",
  },
  late: {
    icon: "⏱",
    active: "bg-amber-100 text-amber-600 ring-2 ring-amber-500",
    inactive: "text-gray-300 hover:text-amber-500 hover:bg-amber-50",
  },
};

export const AttendanceListView = ({ students, attendance, onMark }: AttendanceListViewProps) => {
  if (students.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
      {students.map((s) => {
        const currentStatus = attendance[s.id];
        return (
          <div
            key={s.id}
            className="px-5 py-3 flex items-center justify-between"
          >
            <div>
              <span className="text-gray-800 font-medium text-sm">{s.name}</span>
              {s.admissionNo && (
                <span className="ml-2 text-xs text-gray-400">{s.admissionNo}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(Object.keys(statusIcons) as AttendanceStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => onMark(s.id, status)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStatus === status
                      ? statusIcons[status].active
                      : statusIcons[status].inactive
                  }`}
                  title={status.charAt(0).toUpperCase() + status.slice(1)}
                >
                  {statusIcons[status].icon}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
