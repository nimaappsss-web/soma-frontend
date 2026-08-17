import { VolumeHigh } from "iconsax-react";

import { useAnnouncements } from "../features/announcements/api";
import { AnnouncementCard } from "../features/announcements/components/AnnouncementCard";
import { EmptyState } from "../components/ui/EmptyState";

export const ParentAnnouncements = () => {
  const { data, isLoading } = useAnnouncements({ limit: 50 });
  const announcements = data?.announcements ?? [];

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray900">Announcements</h1>
        <p className="text-sm text-gray500 mt-1">School-wide announcements from your administration</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray400 text-center py-12">Loading...</p>
      ) : announcements.length > 0 ? (
        <div className="max-w-2xl space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<VolumeHigh size={30} variant="Bold" color="#0D0D0D" />}
          title="No announcements yet"
          description="Updates and notices from your child's school will show up here."
        />
      )}
    </div>
  );
};