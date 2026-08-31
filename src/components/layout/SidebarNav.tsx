import { NavLink } from "react-router";
import { ArrowRight2 } from "iconsax-react";
import { cn } from "@/lib/utils";
import type { NavChild, NavSection } from "./types";

interface SidebarNavProps {
  sections: NavSection[];
  expandedItems: Record<string, boolean>;
  toggleExpanded: (label: string) => void;
  isChildActive: (children: NavChild[]) => boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  disabled?: boolean;
  autoExpandActive?: boolean;
}

export const SidebarNav = ({
  sections,
  expandedItems,
  toggleExpanded,
  isChildActive,
  collapsed,
  onNavigate,
  disabled,
  autoExpandActive,
}: SidebarNavProps) => {
  const visibleSections: NavSection[] = sections
    .map((section) => ({ ...section, items: section.items ?? [] }))
    .filter((section) => section.items.length > 0);

  return (
  <nav
    className={cn(
      "flex-1 py-4 space-y-0.5 overflow-y-auto",
      collapsed ? "px-[12px]" : "px-3",
      disabled && "pointer-events-none opacity-40",
    )}
  >
    {visibleSections.map((section, idx) => (
      <div key={idx} className="space-y-0.5">
        {section.divider && idx > 0 && <div className="border-t border-gray100 my-2" />}
        {section.items.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const active = hasChildren ? isChildActive(item.children!) : false;
          if (hasChildren) {
            if (collapsed) {
              return (
                <NavLink
                  key={item.to}
                  to={item.children![0].to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-start h-[45px] w-[48px] transition-colors",
                      isActive || active
                        ? "bg-gray900 text-white font-medium rounded-xl"
                        : "text-gray700 hover:bg-gray50 hover:text-gray900 rounded-[20px]",
                    )
                  }
                >
                  <span className="ml-[12px]"><item.Icon variant="Bold" size={24} color="currentColor" /></span>
                </NavLink>
              );
            }
            const isExpanded = expandedItems[item.label] ?? (autoExpandActive ? active : false);
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className={cn(
                    "flex items-center gap-3 px-4 h-[45px] rounded-[20px] text-sm transition-colors w-full",
                    active
                      ? "bg-gray900 text-white font-medium"
                      : "text-gray700 hover:bg-gray50 hover:text-gray900",
                  )}
                >
                  <span className="shrink-0"><item.Icon variant="Bold" size={24} color="currentColor" /></span>
                  <span className="flex-1 text-left">{item.label}</span>
                  <ArrowRight2
                    variant="Linear"
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
                          end={child.end}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 pl-10 pr-4 h-[40px] rounded-[20px] text-sm transition-colors",
                              isActive
                                ? "bg-gray900/10 text-gray900 font-medium"
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
              end={item.end}
              onClick={onNavigate}
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
              <span className={cn("shrink-0", collapsed ? "ml-[12px]" : "")}><item.Icon variant="Bold" size={24} color="currentColor" /></span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>
    ))}
  </nav>
  );
};