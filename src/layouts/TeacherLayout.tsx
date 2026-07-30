import { NavLink, Outlet } from "react-router";
import {
  Home,
  ClipboardTick,
  Profile2User,
  Book1,
  Speaker,
  Setting,
  NotificationBing,
  Building,
  ArrowLeft2,
} from "iconsax-react";

import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "../components/ui/Avatar";
import { useSidebarCollapse } from "../hooks/useSidebarCollapse";
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
  { label: "Home", to: "/teach", Icon: Home, end: true },
  { label: "Attendance", to: "/teach/attendance", Icon: ClipboardTick },
  { label: "Students", to: "/teach/students", Icon: Profile2User },
  { label: "Lesson Notes", to: "/teach/lesson-notes", Icon: Book1 },
  { label: "Announcements", to: "/teach/announcements", Icon: Speaker },
];

export const TeacherLayout = () => {
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <div className="flex h-screen bg-offWhite overflow-hidden">
      {/* Sidebar — full height */}
      <aside
        className={cn(
          "h-full bg-pureWhite flex flex-col border-r border-gray100 transition-[width] duration-300 shrink-0 overflow-hidden",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
        {/* Top: Logo + collapse button */}
        <div className={cn("flex items-center h-[62px] shrink-0 border-b border-gray100", collapsed ? "justify-center px-2" : "justify-between px-5")}>
          {!collapsed && (
            <img src="/icons/somawordmark_black.svg" alt="Soma" className="w-[107px] h-[23px]" />
          )}
          <button
            onClick={toggle}
            className="flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-gray900 hover:bg-gray800 transition-colors"
          >
            <ArrowLeft2
              variant="Bold"
              size={14}
              color="#FFFFFF"
              className={cn("transition-transform duration-300", collapsed && "rotate-180")}
            />
          </button>
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 py-4 space-y-0.5 overflow-y-auto", collapsed ? "px-2" : "px-3")}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center h-[45px] rounded-full text-sm transition-colors",
                  collapsed ? "justify-center" : "gap-3 px-4",
                  isActive
                    ? "bg-gray900 text-white font-medium"
                    : "text-gray700 hover:bg-gray50 hover:text-gray900",
                )
              }
            >
              <span className="shrink-0"><item.Icon variant="Bold" size={24} color="currentColor" /></span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Settings */}
        <div className={cn("pt-1 shrink-0", collapsed ? "px-2" : "px-3")}>
          <NavLink
            to="/teach/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center h-[45px] rounded-full text-sm transition-colors",
                collapsed ? "justify-center" : "gap-3 px-4",
                isActive
                  ? "bg-gray900 text-white font-medium"
                  : "text-gray700 hover:bg-gray50 hover:text-gray900",
              )
            }
          >
            <Setting variant="Bold" size={24} color="currentColor" />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </div>

        {/* Bottom: School info */}
        <div className={cn("border-t border-gray100 mt-1 shrink-0", collapsed ? "px-2 pb-4 pt-3" : "px-3 pb-4 pt-3")}>
          {collapsed ? (
            <div className="flex items-center justify-center h-[45px]">
              <Building variant="Bold" size={20} className="text-gray300" />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 h-[45px]">
              <Building variant="Bold" size={20} className="text-gray300 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray900 truncate">{user?.schoolName ?? "School"}</p>
                <p className="text-[10px] text-gray500 truncate">School Address</p>
              </div>
            </div>
          )}
        </div>

        {/* Double-click edge */}
        <div
          onDoubleClick={toggle}
          className="absolute top-0 right-0 h-full w-[4px] cursor-col-resize hover:bg-gray200 transition-colors"
        />
      </aside>

      {/* Right side: header + content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[62px] shrink-0 bg-pureWhite border-b border-gray100 flex items-center justify-end px-6">
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

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
