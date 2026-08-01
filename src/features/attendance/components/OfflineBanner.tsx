import { CloudCross } from "iconsax-react";
import { useOnline } from "../../../hooks/useOnline";

interface OfflineBannerProps {
  isStale: boolean;
  savedAt?: number;
  dataDate?: string;
  requestedDate?: string;
}

const formatTime = (ts: number) =>
  new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export const OfflineBanner = ({ isStale, savedAt, dataDate, requestedDate }: OfflineBannerProps) => {
  const online = useOnline();
  if (!isStale) return null;

  const showingExact = dataDate === requestedDate;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-gray100 bg-gray50 px-4 py-3">
      <CloudCross size={16} className="text-gray500 mt-0.5 shrink-0" />
      <div className="text-sm">
        {online && showingExact ? (
          <p className="text-gray700">
            Couldn't refresh — showing attendance synced{" "}
            <span className="font-medium text-gray900">{savedAt ? formatTime(savedAt) : "recently"}</span>.
          </p>
        ) : showingExact ? (
          <p className="text-gray700">
            You're offline — showing attendance synced{" "}
            <span className="font-medium text-gray900">{savedAt ? formatTime(savedAt) : "recently"}</span>.
          </p>
        ) : (
          <p className="text-gray700">
            Showing <span className="font-medium text-gray900">{dataDate ?? "saved"}</span> data.{" "}
            <span className="text-gray500">Connect to the internet to get current data.</span>
          </p>
        )}
      </div>
    </div>
  );
};
