import { Gift, MagicStar } from "iconsax-react";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { useCelebrations } from "../api/useCelebrations";

export const MomentsManagement = () => {
  const { data, isLoading } = useCelebrations();

  const birthdays = data?.celebrations.filter((c) => c.type === "BIRTHDAY") ?? [];
  const anniversaries = data?.celebrations.filter((c) => c.type === "WORK_ANNIVERSARY") ?? [];

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray900">Celebrations</h1>
        <p className="text-sm text-gray-400 mt-1">Upcoming birthdays and work anniversaries</p>
      </div>

      {isLoading ? (
        <div className="py-6">
          <SomaLoader label="Loading celebrations" className="h-8 w-8" />
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Gift size={18} className="text-pink-500" />
              <h2 className="text-base font-medium text-gray-900">Birthdays</h2>
              <span className="text-xs text-gray-400 ml-1">({birthdays.length} upcoming)</span>
            </div>
            {birthdays.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center mb-3">
                  <Gift size={22} className="text-pink-300" />
                </div>
                <p className="text-sm text-gray-400">No upcoming birthdays</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {birthdays.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-medium">
                      {b.personName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.personName}</p>
                      <p className="text-xs text-gray-400">{b.personRole.replace("_", " ")} &middot; Turning {b.age}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MagicStar size={18} className="text-amber-500" variant="Bold" />
              <h2 className="text-base font-medium text-gray-900">Work Anniversaries</h2>
              <span className="text-xs text-gray-400 ml-1">({anniversaries.length} upcoming)</span>
            </div>
            {anniversaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-3">
                  <MagicStar size={22} className="text-amber-300" variant="Bold" />
                </div>
                <p className="text-sm text-gray-400">No upcoming work anniversaries</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {anniversaries.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-sm font-medium">
                      {a.personName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.personName}</p>
                      <p className="text-xs text-gray-400">{a.personRole.replace("_", " ")} &middot; {a.yearsAtSchool} year{a.yearsAtSchool === 1 ? "" : "s"}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
