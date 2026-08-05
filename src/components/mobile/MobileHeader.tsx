import { ArrowLeft2, NotificationBing } from "iconsax-react";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../ui/Avatar";
export const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user } = useAuth();
  return (
    <header
      className="flex items-center min-h-[62px] shrink-0 bg-pureWhite border-b border-gray100 px-4 md:hidden"
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
        <button className="flex items-center justify-center w-[34px] h-[34px] rounded-full border border-gray100 text-gray700 hover:text-gray900 hover:border-gray200 transition-colors">
          <NotificationBing variant="Linear" size={20} color="currentColor" />
        </button>
        <Avatar
          name={user?.name ?? "?"}
          size={32}
          className="border border-gray100"
        />
      </div>
    </header>
  );
};
