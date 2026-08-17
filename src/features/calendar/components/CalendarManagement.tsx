import { Outlet, useLocation } from "react-router";

import { HelpHint } from "../../../components/ui/HelpHint";

export { CalendarEvents } from "./CalendarEvents";
export { CalendarHolidays } from "./CalendarHolidays";
export { CalendarTerms } from "./CalendarTerms";

export const CalendarLayout = () => {
  const location = useLocation();
  const title = location.pathname.endsWith("/events") ? "Events"
    : location.pathname.endsWith("/holidays") ? "Holidays"
    : "Terms";
  const subtitle = location.pathname.endsWith("/events") ? "Events, activities, and important dates"
    : location.pathname.endsWith("/holidays") ? "Non-school days"
    : "School term definitions";

  const sections =
    location.pathname.endsWith("/events")
      ? [
          { title: "Add events", text: "Create events for activities, meetings, and important dates so the whole school stays informed." },
          { title: "See the calendar", text: "Events appear on the calendar and in each day's list, so nothing gets missed." },
        ]
      : location.pathname.endsWith("/holidays")
        ? [
            { title: "Add holidays", text: "Record non-school days so they're excluded from attendance and the school calendar." },
            { title: "Stay accurate", text: "Keep holiday dates up to date — they affect attendance and scheduling across the app." },
          ]
        : [
            { title: "Define terms", text: "Set the name, session, and date range for each term of the school year." },
            { title: "Active term", text: "Mark the current term as active — it drives CA periods, attendance, and reports." },
            { title: "Avoid overlaps", text: "Keep term dates from overlapping so records stay clean." },
          ];

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-5">
        <div className="group flex items-center gap-2.5">
          <h1 className="text-[18px] sm:text-2xl font-semibold text-gray-900">{title}</h1>
          <HelpHint
            title={title}
            description={subtitle}
            storageKey={`calendar-${title.toLowerCase()}`}
            sections={sections}
          />
        </div>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>
      <Outlet />
    </div>
  );
};
