import { NavLink, Outlet, useLocation } from "react-router";

import { cn } from "../../../lib/utils";
import { CalendarTick, Setting2 } from "iconsax-react";

const TABS = [
  { key: "classes", label: "Classes", to: "/admin/timetable", Icon: CalendarTick },
  { key: "configs", label: "Configurations", to: "/admin/timetable/configs", Icon: Setting2 },
];

export const TimetableLayout = () => {
  const location = useLocation();

  const isClassesRoute =
    location.pathname === "/admin/timetable" || location.pathname.startsWith("/admin/timetable/");
  const activeKey = isClassesRoute && !location.pathname.startsWith("/admin/timetable/configs") ? "classes" : "configs";

  const title = activeKey === "configs" ? "Configurations" : "Timetable";
  const subtitle =
    activeKey === "configs"
      ? "One schedule & subject setup per batch — every class in the batch follows it."
      : "Open any class to view or build its schedule.";

  return (
    <div className="flex flex-col min-h-full w-full">
      <div className="w-full p-4 md:p-6 pb-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray900">{title}</h1>
          <p className="text-sm text-placeholder mt-1">{subtitle}</p>

          <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-input bg-card p-1">
            {TABS.map(({ key, label, to, Icon }) => {
              const active = activeKey === key;
              return (
                <NavLink
                  key={key}
                  to={to}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
                  )}
                >
                  <Icon size={15} color={active ? "#FFFFFF" : "#8C8C8C"} />
                  {label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};