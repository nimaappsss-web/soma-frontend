import type { ReactNode } from "react";
import { Warning2 } from "iconsax-react";
import { Link } from "react-router";

import { cn } from "@/lib/utils";

interface WarningBannerLink {
  to: string;
  label: string;
}

interface WarningBannerProps {
  title: string;
  description?: string;
  link?: WarningBannerLink;
  children?: ReactNode;
  className?: string;
}

export const WarningBanner = ({ title, description, link, children, className }: WarningBannerProps) => (
  <div
    className={cn(
      "flex items-start gap-3 rounded-xl border border-amber500/30 bg-amber500/5 px-4 py-4",
      className,
    )}
  >
    <Warning2 size={18} variant="Bold" color="#B45309" className="shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm font-medium text-gray900">{title}</p>
      {description && <p className="text-xs text-gray500 mt-1">{description}</p>}
      {children}
      {link && (
        <Link
          to={link.to}
          className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-medium text-gray900 underline underline-offset-2 hover:text-gray600 transition-colors"
        >
          {link.label}
        </Link>
      )}
    </div>
  </div>
);
