import { VolumeHigh, Danger, Warning2, Notification, Clock } from "iconsax-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Announcement, AnnouncementPriority } from "../types";

const PRIORITY_META: Record<AnnouncementPriority, { label: string; chip: string; icon: typeof Notification; iconBg: string; color: string }> = {
  URGENT: {
    label: "Urgent",
    chip: "bg-red-500/10 text-red500",
    icon: Danger,
    iconBg: "bg-[#FFF0ED]",
    color: "#CD432F",
  },
  IMPORTANT: {
    label: "Important",
    chip: "bg-amber-500/10 text-amber600",
    icon: Warning2,
    iconBg: "bg-amber-300/20",
    color: "#D97706",
  },
  NORMAL: {
    label: "Normal",
    chip: "bg-gray50 text-gray500",
    icon: Notification,
    iconBg: "bg-gray50",
    color: "#8C8C8C",
  },
};

const AUDIENCE_LABELS: Record<string, string> = {
  ALL_STAFF: "All Staff",
  TEACHING_ONLY: "Teaching Staff",
  NON_TEACHING_ONLY: "Non-Teaching Staff",
  ALL_PARENTS: "All Parents",
  ALL_USERS: "Everyone",
  PARENTS: "Parents",
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface AnnouncementCardProps {
  announcement: Announcement;
  showAudience?: boolean;
  action?: ReactNode;
}

export const AnnouncementCard = ({ announcement: a, showAudience = false, action }: AnnouncementCardProps) => {
  const meta = PRIORITY_META[a.priority] ?? PRIORITY_META.NORMAL;
  const Icon = meta.icon;

  return (
    <article className="group bg-white rounded-3xl border border-gray100 p-5 transition-shadow hover:border-gray200 hover:shadow-[0_4px_24px_-12px_rgba(0,0,0,0.12)]">
      <div className="flex items-start gap-3.5">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", meta.iconBg)}>
          <Icon size={18} color={meta.color} variant="Bold" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray900 leading-snug">{a.title}</h3>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full", meta.chip)}>
                {meta.label}
              </span>
              {action}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray600 whitespace-pre-wrap leading-relaxed">{a.message}</p>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-gray50 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray500">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-full bg-gray900 text-white flex items-center justify-center text-[9px] font-semibold shrink-0">
            {initials(a.createdBy.name)}
          </span>
          <span className="font-medium text-gray700 truncate">{a.createdBy.name}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={12} color="#8C8C8C" />
          {formatDate(a.createdAt)}
        </span>
        {showAudience && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray50 px-2.5 py-1 text-[11px] font-medium">
            <VolumeHigh size={11} color="#8C8C8C" />
            {AUDIENCE_LABELS[a.audience] ?? a.audience}
          </span>
        )}
      </div>
    </article>
  );
};