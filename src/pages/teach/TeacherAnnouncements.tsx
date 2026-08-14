import { Speaker } from "iconsax-react";

import { useAnnouncements } from "../../features/announcements/api";
import { EmptyState } from "../../components/ui/EmptyState";
import { HelpHint } from "../../components/ui/HelpHint";

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
    <div className="p-6 w-full">
      <div className="mb-6">
        <div className="group flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-bold text-gray900">Announcements</h1>
          <HelpHint
            title="Announcements"
            storageKey="teacher-announcements"
            description="School-wide announcements from your administration."
            sections={[
              { title: "Reading announcements", text: "Each card shows the title, priority, and who the announcement is for." },
              { title: "Priority badges", text: "URGENT (red), IMPORTANT (amber), and NORMAL (gray) help you spot what needs attention first." },
              { title: "Keep up to date", text: "New announcements appear here as soon as the school publishes them." },
            ]}
          />
        </div>
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
        <EmptyState
          icon={<Speaker size={30} variant="Bold" color="#0D0D0D" />}
          title="No announcements yet"
          description="Updates and notices from your school will show up here."
        />
      )}
    </div>
  );
};
