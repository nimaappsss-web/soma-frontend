import { Outlet, useLocation } from "react-router";

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

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-6">
        <h1 className="text-[18px] sm:text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>
      <Outlet />
    </div>
  );
};
