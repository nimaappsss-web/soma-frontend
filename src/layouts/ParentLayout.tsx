import { NavLink, Link, Outlet } from "react-router";
import {
  Home,
  Teacher,
  Speaker,
  Setting,
  NotificationBing,
  Building,
} from "iconsax-react";

import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "../components/ui/Avatar";
import { cn } from "../lib/utils";

import type { IconProps } from "iconsax-react";

type IconComponent = React.FC<IconProps>;

interface NavItem {
  label: string;
  to: string;
  Icon: IconComponent;
  end?: boolean;
}

const navItems: NavItem[] = [
  { label: "Home", to: "/parent", Icon: Home, end: true },
  { label: "Children", to: "/parent/children", Icon: Teacher },
  { label: "Announcements", to: "/parent/announcements", Icon: Speaker },
];

export const ParentLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-offWhite">
      <header className="h-[62px] shrink-0 bg-pureWhite border-b border-gray100 flex items-center justify-between px-6">
        <Link to="/parent">
          <img src="/icons/somawordmark_black.svg" alt="Soma" className="w-[107px] h-[23px]" />
        </Link>
        <div className="flex items-center gap-4">
          <button className="relative text-gray500 hover:text-gray900 transition-colors">
            <NotificationBing variant="Bold" size={22} />
          </button>
          <div className="flex items-center gap-2.5">
            <Avatar name={user?.name ?? "?"} size={36} className="border border-gray100" />
            <div>
              <p className="text-sm font-medium text-gray900 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-gray500 capitalize leading-tight">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-[264px] shrink-0 bg-pureWhite flex flex-col h-full border-r border-gray100">
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 h-[45px] rounded-full text-sm transition-colors",
                    isActive
                      ? "bg-gray900 text-white font-medium"
                      : "text-gray700 hover:bg-gray50 hover:text-gray900",
                  )
                }
              >
                <span className="shrink-0"><item.Icon variant="Bold" size={24} color="currentColor" /></span>
                <span className="flex-1">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="px-3 pt-1">
            <NavLink
              to="/parent/settings"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 h-[45px] rounded-full text-sm transition-colors",
                  isActive
                    ? "bg-gray900 text-white font-medium"
                    : "text-gray700 hover:bg-gray50 hover:text-gray900",
                )
              }
            >
              <Setting variant="Bold" size={24} color="currentColor" />
              <span>Settings</span>
            </NavLink>
          </div>

          <div className="px-3 pb-4 pt-3 border-t border-gray100 mt-1">
            <div className="flex items-center gap-3 px-4 h-[45px]">
              <Building variant="Bold" size={20} className="text-gray300 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray900 truncate">{user?.schoolName ?? "School"}</p>
                <p className="text-[10px] text-gray500 truncate">School Address</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
