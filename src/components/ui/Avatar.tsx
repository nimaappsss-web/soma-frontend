import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { useOnline } from "../../hooks/useOnline";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

const DICEBEAR_BASE = "https://api.dicebear.com/9.x/adventurer-neutral/svg";

const Initials = ({ name, size, className }: { name: string; size: number; className: string }) => {
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      role="img"
      aria-label={name || "Avatar"}
      className={cn(
        "flex items-center justify-center rounded-full bg-gray-900 font-medium uppercase text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        fontSize: Math.max(11, Math.round(size * 0.42)),
      }}
    >
      {initial}
    </div>
  );
};

export const Avatar = ({ name, imageUrl, size = 40, className = "" }: AvatarProps) => {
  const online = useOnline();
  const safeName = name ?? "";
  const seed = useMemo(() => encodeURIComponent(safeName.trim()), [safeName]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (online) setFailed(false);
  }, [online]);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  if (!online || failed) {
    return <Initials name={safeName} size={size} className={className} />;
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={safeName}
        draggable={false}
        onError={() => setFailed(true)}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
    );
  }

  return (
    <div
      className={cn("overflow-hidden rounded-full bg-gray-100", className)}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <img
        src={`${DICEBEAR_BASE}?seed=${seed}`}
        alt={safeName}
        draggable={false}
        onError={() => setFailed(true)}
        className="h-full w-full"
        style={{ objectFit: "cover" }}
      />
    </div>
  );
};