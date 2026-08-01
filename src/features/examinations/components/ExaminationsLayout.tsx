import { NavLink, Outlet, Navigate } from "react-router";
import { StatusUp } from "iconsax-react";
import { cn } from "../../../lib/utils";

const tabs = [
  { label: "Scoring", to: "/admin/examinations/scoring" },
  { label: "Configure", to: "/admin/examinations/configure" },
];

export const ExaminationsLayout = () => {
  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 md:p-6 pb-0 w-full">
        <div className="flex items-center gap-3 mb-1">
          <StatusUp size={20} color="#B3B3B3" variant="Bold" />
          <h1 className="text-xl font-semibold text-gray900">CA &amp; Examinations</h1>
        </div>
        <p className="text-sm text-gray500 mb-4 ml-8">Score configuration and student scoring</p>

        <div className="flex gap-1 max-w-xs mb-4 rounded-full bg-gray100 p-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "flex-1 rounded-full px-4 py-1.5 text-sm text-center font-medium transition-colors",
                  isActive ? "bg-white text-gray900 shadow-sm" : "text-gray500 hover:text-gray700",
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export const ExaminationsIndex = () => <Navigate to="scoring" replace />;
