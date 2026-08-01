import { ArrowRight, TickCircle } from "iconsax-react";

interface SetupCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  completed?: boolean;
  to?: string;
}

export const SetupCard = ({ title, subtitle, icon, bgColor, iconColor, completed, to }: SetupCardProps) => {
  const Tag = to ? "a" : "div";
  const linkProps = to ? { href: to } : {};

  return (
    <Tag
      className="bg-white rounded-[30px] border border-gray100 h-[80px] px-5 flex items-center gap-3 hover:border-gray300 transition-colors cursor-pointer"
      {...linkProps}
    >
      <div className={`w-[50px] h-[50px] rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray900">{title}</p>
        <p className="text-xs text-gray500 mt-0.5">{subtitle}</p>
      </div>
      {completed ? (
        <TickCircle variant="Bold" size={24} color="#0D0D0D" className="shrink-0" />
      ) : (
        <ArrowRight variant="Bold" size={16} className="text-gray300 shrink-0" />
      )}
    </Tag>
  );
};
