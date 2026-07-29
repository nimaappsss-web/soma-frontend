import { Megaphone } from "lucide-react";

import { useAnnouncements } from "../../features/announcements/api";

const audienceLabels: Record<string, string> = {
  ALL_STAFF: "All Staff",
  TEACHING_ONLY: "Teaching Staff",
  NON_TEACHING_ONLY: "Non-Teaching Staff",
  ALL_PARENTS: "All Parents",
  ALL_USERS: "Everyone",
};

const priorityStyles: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  IMPORTANT: "bg-amber-100 text-amber-700",
  NORMAL: "bg-gray-100 text-gray-600",
};

export const TeacherAnnouncements = () => {
  const { data, isLoading } = useAnnouncements({ limit: 50 });
  const announcements = data?.announcements ?? [];

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-400 mt-1">School-wide announcements from your administration</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-12">Loading...</p>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-900">{a.title}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${priorityStyles[a.priority] ?? ""}`}>
                  {a.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.message}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{a.createdBy.name}</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                <span>{audienceLabels[a.audience] ?? a.audience}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-6 text-center">
            <Megaphone size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No announcements yet</p>
          </div>
        </div>
      )}
    </div>
  );
};
