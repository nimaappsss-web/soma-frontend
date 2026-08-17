import { VolumeHigh } from "iconsax-react";

import { useAnnouncements } from "../features/announcements/api";
import { EmptyState } from "../components/ui/EmptyState";

const priorityStyles: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700",
  IMPORTANT: "bg-amber-100 text-amber-700",
  NORMAL: "bg-gray-100 text-gray-600",
};

export const ParentAnnouncements = () => {
  const { data, isLoading } = useAnnouncements({ limit: 50 });
  const announcements = data?.announcements ?? [];

  return (
    <div className="w-full px-6 py-8">
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-gray900">Announcements</h2>
        <p className="text-sm text-gray400 mt-1">School-wide announcements from your administration</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray400 text-center py-12">Loading...</p>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray100 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray900">{a.title}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${priorityStyles[a.priority] ?? ""}`}>
                  {a.priority}
                </span>
              </div>
              <p className="text-sm text-gray600 whitespace-pre-wrap">{a.message}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray400">
                <span>{a.createdBy.name}</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
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