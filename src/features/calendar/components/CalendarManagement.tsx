import { Outlet, useLocation } from "react-router";
import { Calendar } from "lucide-react";

export { CalendarEvents } from "./CalendarEvents";
export { CalendarHolidays } from "./CalendarHolidays";
export { CalendarTerms } from "./CalendarTerms";

export const CalendarLayout = () => {
  const location = useLocation();
  const subtitle = location.pathname.endsWith("/events") ? "Events, activities, and important dates"
    : location.pathname.endsWith("/holidays") ? "Non-school days"
    : "School term definitions";

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-1">
        <Calendar size={20} className="text-gray-400" />
        <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
      </div>
      <p className="text-sm text-gray-400 mb-6 ml-9">{subtitle}</p>
      <Outlet />
    </div>
  );
};
