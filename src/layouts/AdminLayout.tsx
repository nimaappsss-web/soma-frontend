import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
  Home2,
  Teacher,
  Profile2User,
  Briefcase,
  Book,
  Calendar,
  CalendarTick,
  Card,
  VolumeHigh,
  Setting2,
  MagicStar,
  ClipboardTick,
  ArrowRight,
  Chart,
  StatusUp,
  NotificationBing,
  Building,
  ArrowLeft2,
} from "iconsax-react";

import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "../components/ui/Avatar";
import { SchoolSetupWizard } from "../features/principal/components/SchoolSetupWizard";
import { PhoneSetupDialog } from "../features/principal/components/PhoneSetupDialog";
import { useSidebarCollapse } from "../hooks/useSidebarCollapse";
import { cn } from "../lib/utils";

import type { IconProps } from "iconsax-react";

type IconComponent = React.FC<IconProps>;

interface NavItem {
  label: string;
  to: string;
  Icon: IconComponent;
  hasCaret?: boolean;
  children?: { label: string; to: string }[];
}

const group1: NavItem[] = [
  { label: "Home", to: "/admin", Icon: Home2 },
  { label: "Students", to: "/admin/students", Icon: Teacher },
  {
    label: "Staff",
    to: "/admin/staff",
    Icon: Briefcase,
    hasCaret: true,
    children: [
      { label: "Teachers", to: "/admin/teachers" },
      { label: "Non-Teachers", to: "/admin/staff" },
    ],
  },
  { label: "Parents", to: "/admin/parents", Icon: Profile2User },
];

const group2: NavItem[] = [
  { label: "Classes", to: "/admin/classes", Icon: Teacher },
  { label: "Subjects", to: "/admin/subjects", Icon: Book },
  { label: "Timetable", to: "/admin/timetable", Icon: CalendarTick },
  { label: "Attendance", to: "/admin/attendance", Icon: ClipboardTick },
  { label: "Examinations", to: "/admin/examinations", Icon: StatusUp },
  {
    label: "Calendar",
    to: "/admin/calendar",
    Icon: Calendar,
    hasCaret: true,
    children: [
      { label: "Events", to: "/admin/calendar/events" },
      { label: "Holidays", to: "/admin/calendar/holidays" },
      { label: "Terms", to: "/admin/calendar/terms" },
    ],
  },
];

const group3: NavItem[] = [
  { label: "Finance", to: "/admin/finance", Icon: Card },
  { label: "Moments", to: "/admin/moments", Icon: MagicStar },
  { label: "Reports", to: "/admin/reports", Icon: Chart },
];

const group4: NavItem[] = [
  { label: "Announcements", to: "/admin/announcements", Icon: VolumeHigh },
  { label: "Settings", to: "/admin/settings", Icon: Setting2 },
];

const SidebarNav = ({
  items,
  expandedItems,
  toggleExpanded,
  isChildActive,
  collapsed,
}: {
  items: NavItem[];
  expandedItems: Record<string, boolean>;
  toggleExpanded: (label: string) => void;
  isChildActive: (children: { label: string; to: string }[]) => boolean;
  collapsed: boolean;
}) => (
  <>
    {items.map((item) => {
      const isExpanded = expandedItems[item.label] ?? false;
      const hasChildren = item.children && item.children.length > 0;

      if (hasChildren) {
        const active = isChildActive(item.children!);

        if (collapsed) {
          return (
            <NavLink
              key={item.to}
              to={item.children![0].to}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-start h-[45px] w-[48px] transition-colors",
                  isActive || active
                    ? "bg-gray900 text-white font-medium rounded-xl"
                    : "text-gray700 hover:bg-gray50 hover:text-gray900 rounded-full",
                )
              }
            >
              <span className="ml-[12px]"><item.Icon variant="Bold" size={24} color="currentColor" /></span>
            </NavLink>
          );
        }

        return (
          <div key={item.label}>
            <button
              onClick={() => toggleExpanded(item.label)}
              className={cn(
                "flex items-center gap-3 px-4 h-[45px] rounded-full text-sm transition-colors w-full",
                active
                  ? "bg-gray900 text-white font-medium"
                  : "text-gray700 hover:bg-gray50 hover:text-gray900",
              )}
            >
              <span className="shrink-0"><item.Icon variant="Bold" size={24} color="currentColor" /></span>
              <span className="flex-1 text-left">{item.label}</span>
              <ArrowRight
                variant="Bold"
                size={14}
                color="currentColor"
                className={cn(
                  "shrink-0 text-gray400 transition-transform duration-300",
                  isExpanded && "rotate-90",
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-in-out",
                isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <div className="ml-4 py-0.5 space-y-0.5">
                  {item.children!.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 pl-10 pr-4 h-[40px] rounded-full text-sm transition-colors",
                          isActive
                            ? "bg-gray900 text-white font-medium"
                            : "text-gray700 hover:bg-gray50 hover:text-gray900",
                        )
                      }
                    >
                      <span className="flex-1">{child.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/admin"}
          className={({ isActive }) =>
            cn(
              "flex items-center h-[45px] text-sm transition-colors",
              collapsed ? "justify-start w-[48px] px-0" : "gap-3 px-4 rounded-full",
              collapsed && isActive && "bg-gray900 text-white font-medium rounded-xl",
              collapsed && !isActive && "text-gray700 hover:bg-gray50 hover:text-gray900 rounded-full",
              !collapsed && isActive && "bg-gray900 text-white font-medium rounded-full",
              !collapsed && !isActive && "text-gray700 hover:bg-gray50 hover:text-gray900 rounded-full",
            )
          }
        >
          <span className={cn("shrink-0", collapsed ? "ml-[12px]" : "")}><item.Icon variant="Bold" size={24} color="currentColor" /></span>
          {!collapsed && <span className="flex-1">{item.label}</span>}
        </NavLink>
      );
    })}
  </>
);

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const { collapsed, toggle } = useSidebarCollapse();

  const needsSchoolSetup = user?.needsSchoolSetup ?? user?.hasSchool === false;

  if (needsSchoolSetup) {
    return <SchoolSetupWizard />;
  }

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isChildActive = (children: { label: string; to: string }[]) =>
    children.some((child) => location.pathname.startsWith(child.to));

  return (
    <div className="flex h-screen bg-offWhite overflow-hidden">
      {user?.needsPhoneSetup && <PhoneSetupDialog />}

      {/* Sidebar — full height */}
      <aside
        className={cn(
          "h-full bg-pureWhite flex flex-col border-r border-gray100 transition-[width] duration-300 shrink-0 overflow-hidden relative",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
        {/* Top: Logo / collapse trigger */}
        <div className={cn("flex items-center h-[62px] shrink-0 border-b border-gray100", collapsed ? "justify-center px-2" : "justify-between px-5")}>
          {collapsed ? (
            <div className="group relative flex items-center justify-center w-[26px] h-[26px] cursor-pointer" onClick={toggle}>
              <img
                src="/blackLogo.png"
                alt="Soma"
                className="absolute inset-0 w-full h-full object-contain opacity-100 group-hover:opacity-0 transition-opacity duration-200"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-gray900">
                  <ArrowLeft2 variant="Bold" size={14} color="#FFFFFF" className="rotate-180" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <img src="/icons/somawordmark_black.svg" alt="Soma" className="w-[107px] h-[23px]" />
              <button
                onClick={toggle}
                className="flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-gray900 hover:bg-gray800 transition-colors"
              >
                <ArrowLeft2 variant="Bold" size={14} color="#FFFFFF" />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 py-4 space-y-0.5 overflow-y-auto", collapsed ? "px-[12px]" : "px-3")}>
          <SidebarNav items={group1} expandedItems={expandedItems} toggleExpanded={toggleExpanded} isChildActive={isChildActive} collapsed={collapsed} />
          <div className="border-t border-gray100 my-2" />
          <SidebarNav items={group2} expandedItems={expandedItems} toggleExpanded={toggleExpanded} isChildActive={isChildActive} collapsed={collapsed} />
          <div className="border-t border-gray100 my-2" />
          <SidebarNav items={group3} expandedItems={expandedItems} toggleExpanded={toggleExpanded} isChildActive={isChildActive} collapsed={collapsed} />
          <div className="border-t border-gray100 my-2" />
          <SidebarNav items={group4} expandedItems={expandedItems} toggleExpanded={toggleExpanded} isChildActive={isChildActive} collapsed={collapsed} />
        </nav>

        {/* Bottom: School info */}
        <div className={cn("border-t border-gray100 mt-1 shrink-0", collapsed ? "px-[12px] pb-4 pt-3" : "px-3 pb-4 pt-3")}>
          {collapsed ? (
            <div className="flex items-center justify-start h-[45px] w-[48px]">
              <Building variant="Bold" size={20} className="ml-[12px] text-gray300" />
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

        {/* Double-click edge to collapse */}
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
