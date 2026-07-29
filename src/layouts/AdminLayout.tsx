import { type ReactNode, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  Heart,
  Wallet,
  Megaphone,
  Sparkles,
  LayoutGrid,
  BookMarked,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Clock,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "../components/ui/Avatar";
import { SchoolSetupWizard } from "../features/principal/components/SchoolSetupWizard";
import { PhoneSetupDialog } from "../features/principal/components/PhoneSetupDialog";
import { cn } from "../lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

interface NavGroup {
  label: string;
  icon: ReactNode;
  children: NavItem[];
}

const navItems: (NavItem | NavGroup)[] = [
  { label: "Dashboard", to: "/admin", icon: <LayoutDashboard size={18} /> },
  { label: "Students", to: "/admin/students", icon: <GraduationCap size={18} /> },
  { label: "Teachers", to: "/admin/teachers", icon: <BookOpen size={18} /> },
  { label: "Non-Teachers", to: "/admin/staff", icon: <Users size={18} /> },
  { label: "Parents", to: "/admin/parents", icon: <Heart size={18} /> },
  { label: "Finance", to: "/admin/finance", icon: <Wallet size={18} /> },
  { label: "Announcements", to: "/admin/announcements", icon: <Megaphone size={18} /> },
  { label: "Moments", to: "/admin/moments", icon: <Sparkles size={18} /> },
  { label: "Timetable", to: "/admin/timetable", icon: <Clock size={18} /> },
  { label: "Attendance", to: "/admin/attendance", icon: <ClipboardCheck size={18} /> },
  { label: "Examinations", to: "/admin/examinations", icon: <ClipboardList size={18} /> },
  {
    label: "Calendar",
    icon: <Calendar size={18} />,
    children: [
      { label: "Events", to: "/admin/calendar/events", icon: <Calendar size={18} /> },
      { label: "Holidays", to: "/admin/calendar/holidays", icon: <Calendar size={18} /> },
      { label: "Terms", to: "/admin/calendar/terms", icon: <Calendar size={18} /> },
    ],
  },
  { label: "Reports", to: "/admin/reports", icon: <FileText size={18} /> },
  { label: "Classes", to: "/admin/classes", icon: <LayoutGrid size={18} /> },
  { label: "Subjects", to: "/admin/subjects", icon: <BookMarked size={18} /> },
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => ({
    Calendar: location.pathname.startsWith("/admin/calendar"),
  }));

  const needsSchoolSetup = user?.needsSchoolSetup ?? user?.hasSchool === false;

  if (needsSchoolSetup) {
    return <SchoolSetupWizard />;
  }

  return (
    <div className="flex h-screen bg-offWhite">
      {user?.needsPhoneSetup && <PhoneSetupDialog />}

      <aside className="w-56 shrink-0 bg-black flex flex-col h-full">
        <div className="px-5 pt-6 pb-4">
          <Link to="/admin">
            <img src="/icons/somawordmark_black.svg" alt="Soma" className="h-6 brightness-0 invert" />
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            if ("children" in item) {
              const isExpanded = expandedGroups[item.label];
              const isActive = location.pathname.startsWith("/admin/calendar");
              return (
                <div key={item.label}>
                  <button
                    onClick={() =>
                      setExpandedGroups((prev) => ({ ...prev, [item.label]: !prev[item.label] }))
                    }
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-white/10 text-white font-medium"
                        : "text-white/60 hover:text-white hover:bg-white/5",
                    )}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        "transition-transform",
                        isExpanded ? "rotate-0" : "-rotate-90",
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                              isActive
                                ? "bg-white/10 text-white font-medium"
                                : "text-white/60 hover:text-white hover:bg-white/5",
                            )
                          }
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/60 hover:text-white hover:bg-white/5",
                  )
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 pt-2 pb-1">
          <div className="border-t border-white/10" />
        </div>

        <div className="px-3 pb-1">
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5",
              )
            }
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        </div>

        <div className="px-3 pb-4 pt-2 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={user?.name ?? ""} size={28} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/40 truncate">{user?.schoolName ?? user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-white/40 hover:text-white transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
