import { useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { ArrowLeft2, Building, SearchNormal } from "iconsax-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileDropdown } from "@/components/ui/ProfileDropdown";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { MobileDrawer, MobileHeader } from "@/components/mobile";
import { SearchModal } from "@/components/others/SearchModal";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./SidebarNav";
import type { NavChild, NavItem, NavSection } from "./types";

interface AppShellProps {
  nav: NavSection[];
  settings?: NavItem;
  children?: ReactNode;
  disabled?: boolean;
  autoExpandActive?: boolean;
  isChildActive?: (children: NavChild[]) => boolean;
}

export const AppShell = ({
  nav,
  settings,
  children,
  disabled,
  autoExpandActive,
  isChildActive,
}: AppShellProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const { collapsed, toggle } = useSidebarCollapse();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const closeMobile = () => setMobileOpen(false);
  const toggleExpanded = (label: string) =>
    setExpandedItems((prev) => ({ ...prev, [label]: !prev[label] }));

  const defaultChildActive = (itemChildren: NavChild[]) =>
    itemChildren.some((child) => location.pathname.startsWith(child.to));
  const handleChildActive = isChildActive ?? defaultChildActive;

  const settingsLink = settings && (
    <NavLink
      to={settings.to}
      onClick={closeMobile}
      className={({ isActive }) =>
        cn(
          "flex items-center h-[45px] text-sm transition-colors",
          collapsed ? "justify-start w-[48px] px-0" : "gap-3 px-4 rounded-[20px]",
          collapsed && isActive && "bg-gray900 text-white font-medium rounded-xl",
          collapsed && !isActive && "text-gray700 hover:bg-gray50 hover:text-gray900 rounded-[20px]",
          !collapsed && isActive && "bg-gray900 text-white font-medium rounded-[20px]",
          !collapsed && !isActive && "text-gray700 hover:bg-gray50 hover:text-gray900 rounded-[20px]",
        )
      }
    >
      <span className={cn("shrink-0", collapsed ? "ml-[12px]" : "")}>
        <settings.Icon variant="Bold" size={24} color="currentColor" />
      </span>
      {!collapsed && <span>Settings</span>}
    </NavLink>
  );

  const schoolFooter = (
    <div className={cn("border-t border-gray100 mt-1 shrink-0", collapsed ? "px-[12px] pb-4 pt-3" : "px-3 pb-4 pt-3")}>
      {collapsed ? (
        <div className="flex items-center justify-center h-[45px] w-[48px]">
          {user?.logoUrl ? (
            <div className="w-[32px] h-[32px] overflow-hidden rounded-xl border border-gray100 bg-white flex items-center justify-center">
              <img src={user.logoUrl} alt="School logo" className="w-full h-full object-contain p-0.5" />
            </div>
          ) : (
            <Building variant="Bold" size={20} className="text-gray300" />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 h-[45px]">
          {user?.logoUrl ? (
            <div className="h-[38px] w-[38px] shrink-0 overflow-hidden rounded-xl border border-gray100 bg-white flex items-center justify-center">
              <img src={user.logoUrl} alt="School logo" className="w-full h-full object-contain p-1" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[38px] w-[38px] shrink-0 rounded-xl bg-gray50">
              <Building variant="Bold" size={20} className="text-gray300" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray900 truncate">{user?.schoolName ?? "School"}</p>
            <p className="text-[10px] text-gray500 truncate">School Address</p>
          </div>
        </div>
      )}
    </div>
  );

  const sidebarContent = (
    <>
      <SidebarNav
        sections={nav}
        expandedItems={expandedItems}
        toggleExpanded={toggleExpanded}
        isChildActive={handleChildActive}
        collapsed={collapsed}
        onNavigate={closeMobile}
        disabled={disabled}
        autoExpandActive={autoExpandActive}
      />
      {settings && <div className={cn("pt-1 shrink-0", collapsed ? "px-[12px]" : "px-3", disabled && "pointer-events-none opacity-40")}>{settingsLink}</div>}
      {schoolFooter}
    </>
  );

  return (
    <div
      className="flex h-svh overflow-hidden bg-offWhite"
      style={{ height: "100dvh" }}
    >
      {/* Mobile sidebar */}
      <MobileDrawer open={mobileOpen} onClose={closeMobile}>
        <div className="flex items-center justify-between h-[62px] shrink-0 border-b border-gray100 px-5">
          <img src={user?.logoUrl ?? "/blackLogo.png"} alt="Soma" className="h-[22px]" />
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => { closeMobile(); setSearchOpen(true); }}
              className="flex items-center justify-center w-[26px] h-[26px] rounded-lg text-gray700 hover:bg-gray50 hover:text-gray900 transition-colors shrink-0"
            >
              <SearchNormal variant="Linear" size={24} strokeWidth={4} color="currentColor" />
            </button>
            <button
              onClick={closeMobile}
              className="flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-gray900 hover:bg-gray800 transition-colors shrink-0"
            >
              <ArrowLeft2 variant="Bold" size={14} color="#FFFFFF" className="rotate-180" />
            </button>
          </div>
        </div>
        {sidebarContent}
      </MobileDrawer>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "h-full bg-pureWhite flex flex-col border-r border-gray100 transition-[width] duration-300 shrink-0 overflow-hidden relative hidden md:flex",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
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
        {sidebarContent}
        <div
          onDoubleClick={toggle}
          className="absolute top-0 right-0 h-full w-[4px] cursor-col-resize hover:bg-gray200 transition-colors"
        />
      </aside>

      {/* Right side: header + content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <MobileHeader onMenuClick={() => setMobileOpen(true)} />
        <header className="h-[62px] shrink-0 bg-pureWhite border-b border-gray100 items-center justify-end px-6 hidden md:flex">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-[38px] h-[38px] rounded-full border border-gray100 text-gray700 hover:text-gray900 hover:border-gray200 transition-colors"
            >
              <SearchNormal variant="Linear" size={22} color="currentColor" />
            </button>
            <NotificationBell />
            <div className="flex items-center gap-2.5 ml-1">
              <ProfileDropdown />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto min-h-0 pb-[env(safe-area-inset-bottom)]">
          {children ?? <Outlet />}
        </main>
      </div>

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};