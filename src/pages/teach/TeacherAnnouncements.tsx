import { Speaker } from "iconsax-react";

import { useAnnouncements } from "../../features/announcements/api";
import { AnnouncementCard } from "../../features/announcements/components/AnnouncementCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { SomaLoader } from "../../components/ui/SomaLoader";
import { HelpHint } from "../../components/ui/HelpHint";

export const TeacherAnnouncements = () => {
  const { data, isLoading } = useAnnouncements({ limit: 50 });
  const announcements = data?.announcements ?? [];

  return (
    <div className="p-4 md:p-6 w-full">
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
        <p className="text-sm text-gray500 mt-1">School-wide announcements from your administration</p>
      </div>

      {isLoading ? (
        <div className="py-12">
          <SomaLoader label="Loading announcements" className="h-8 w-8" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="max-w-2xl space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} showAudience />
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