import { Clock } from "iconsax-react";

interface ComingSoonProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export const ComingSoon = ({
  title = "Coming soon",
  description = "We're still building this — it'll be available here very soon.",
  compact = false,
}: ComingSoonProps) => (
  <div
    className={
      compact
        ? "flex flex-col items-center rounded-xl border border-dashed border-gray200 bg-offWhite px-6 py-8 text-center"
        : "flex min-h-[calc(100dvh-190px)] w-full flex-col items-center justify-center rounded-2xl bg-white px-6 py-14 text-center"
    }
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5">
      <Clock size={30} color="#8C8C8C" variant="Bold" />
    </div>
    <h3 className="mt-5 text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">{description}</p>
  </div>
);
