import { ArrowLeft2 } from "iconsax-react";
import { ProfileDropdown } from "../ui/ProfileDropdown";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";
export const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  return (
    <header
      className="flex items-center min-h-[62px] shrink-0 bg-pureWhite border-b border-gray100 px-4 md:hidden sticky top-0 z-30"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        onClick={onMenuClick}
        className="flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-gray900 hover:bg-gray800 transition-colors shrink-0"
      >
        <ArrowLeft2 variant="Bold" size={14} color="#FFFFFF" className="rotate-180" />
      </button>
      <img
        src="/icons/somawordmark_black.svg"
        alt="Soma"
        className="h-[18px] ml-3.5"
      />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <NotificationBell />
        <ProfileDropdown />
      </div>
    </header>
  );
};
