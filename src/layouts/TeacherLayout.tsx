import { Link, NavLink, Outlet, useLocation } from "react-router";
import { LayoutDashboard, GraduationCap, ClipboardCheck, BookOpen, Megaphone, Settings, LogOut } from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "../components/ui/Avatar";
import { cn } from "../lib/utils";

const navItems = [
  { label: "Dashboard", to: "/teach", icon: <LayoutDashboard size={18} />, end: true },
  { label: "Attendance", to: "/teach/attendance", icon: <ClipboardCheck size={18} /> },
  { label: "Students", to: "/teach/students", icon: <GraduationCap size={18} /> },
  { label: "Lesson Notes", to: "/teach/lesson-notes", icon: <BookOpen size={18} /> },
  { label: "Announcements", to: "/teach/announcements", icon: <Megaphone size={18} /> },
];

export const TeacherLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-offWhite">
      <aside className="w-56 shrink-0 bg-black flex flex-col h-full">
        <div className="px-5 pt-6 pb-4">
          <Link to="/teach">
            <img src="/icons/somawordmark_black.svg" alt="Soma" className="h-6 brightness-0 invert" />
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
          ))}
        </nav>

        <div className="px-3 pt-2 pb-1">
          <div className="border-t border-white/10" />
        </div>

        <div className="px-3 pb-1">
          <NavLink
            to="/teach/settings"
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
