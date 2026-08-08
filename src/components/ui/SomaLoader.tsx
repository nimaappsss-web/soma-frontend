import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SomaLoaderProps {
  className?: string;
  label?: string;
  descriptions?: string[];
}

export const SomaLoader = ({ className, label, descriptions }: SomaLoaderProps) => {
  const [index, setIndex] = useState(0);
  const description = descriptions?.[index];

  useEffect(() => {
    if (!descriptions || descriptions.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i < descriptions.length - 1 ? i + 1 : i));
    }, 3000);
    return () => clearInterval(id);
  }, [descriptions]);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <img
        src="/blackLogo.png"
        alt="Soma"
        className={cn("h-12 w-12 animate-pulse", className)}
      />
      {label && <p className="text-sm font-medium text-gray-500">{label}</p>}
      {description && (
        <p className="max-w-[260px] text-center text-sm text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
};