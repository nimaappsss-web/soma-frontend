import { useMemo } from "react";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

const DICEBEAR_BASE = "https://api.dicebear.com/9.x/adventurer-neutral/svg";

export const Avatar = ({ name, imageUrl, size = 40, className = "" }: AvatarProps) => {
  const seed = useMemo(() => encodeURIComponent(name.trim()), [name]);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden bg-gray-100 ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <img
        src={`${DICEBEAR_BASE}?seed=${seed}`}
        alt={name}
        className="w-full h-full"
        style={{ objectFit: "cover" }}
      />
    </div>
  );
};
