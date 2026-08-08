import type { ReactNode } from "react";

interface UpcomingItem {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
}

interface UpcomingSection {
  label: string;
  items: UpcomingItem[];
}

interface UpcomingCardProps {
  sections: UpcomingSection[];
  title?: string;
}

export const UpcomingCard = ({ sections = [], title = "Upcoming" }: UpcomingCardProps) => {
  const hasItems = sections.some((s) => s.items.length > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray100 p-5">
      <h3 className="text-base font-semibold text-gray900 mb-4">{title}</h3>
      {!hasItems ? (
        <p className="text-sm text-gray400 py-4 text-center">Nothing upcoming</p>
      ) : (
        <div className="space-y-5">
          {sections.map((section) =>
            section.items.length > 0 ? (
              <div key={section.label}>
                <p className="text-xs font-medium text-gray400 uppercase tracking-wide mb-2.5">{section.label}</p>
                <div className="space-y-2.5">
                  {section.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="shrink-0">{item.icon}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray900 truncate">{item.title}</p>
                        <p className="text-xs text-gray500 truncate">{item.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
};
