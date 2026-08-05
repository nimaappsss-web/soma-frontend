import { useState, useRef, useEffect, isValidElement, cloneElement } from "react";
import { Add } from "iconsax-react";
import { cn } from "@/lib/utils";
interface QuickAddItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  bgColor: string;
  iconColor: string;
}
interface QuickAddButtonProps {
  items: QuickAddItem[];
}
export const QuickAddButton = ({ items }: QuickAddButtonProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const renderIcon = (icon: React.ReactNode, color: string) => {
    if (isValidElement(icon)) {
      return cloneElement(icon as React.ReactElement<{ color?: string }>, { color });
    }
    return icon;
  };
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-[45px] h-[45px] rounded-[20px] bg-gray900 hover:bg-gray800 transition-colors"
      >
        <Add
          variant="Linear"
          size={24}
          color="#FFFFFF"
          className={cn("transition-transform duration-300", open && "rotate-[180deg]")}
        />
      </button>
      <div
        className={cn(
          "absolute right-0 top-full mt-2 w-[200px] rounded-xl border border-gray100 bg-white shadow-lg py-2 z-50 transition-all duration-200 origin-top-right",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
        )}
      >
        {items.map((item, i) => (
          <div key={item.label}>
            {i > 0 && <div className="h-px bg-gray100 mx-5 my-1" />}
            <a
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray50 transition-colors"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  item.bgColor,
                )}
              >
                {renderIcon(item.icon, item.iconColor)}
              </div>
              <span className="text-sm text-gray700">{item.label}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
