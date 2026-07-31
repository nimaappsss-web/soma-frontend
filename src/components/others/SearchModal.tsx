import { useEffect, useState, useCallback, createElement } from "react";
import { useNavigate } from "react-router";
import { Command } from "cmdk";
import {
  SearchNormal,
  Home2, Teacher, Profile2User, Briefcase, Book, Book1,
  Calendar, CalendarTick, ClipboardTick, StatusUp, Card,
  MagicStar, Chart, VolumeHigh, Setting2, Setting,
  UserAdd, DocumentUpload, Send, Link2, AddCircle, Trash,
  Refresh, CalendarAdd, TickCircle, Lock, User, UserEdit,
  Logout, Clock, Filter, ProfileTick, Document,
} from "iconsax-react";
import { Dialog, DialogContent } from "../ui/dialog";
import { useAuth } from "../../contexts/AuthContext";
import { searchIndex, type SearchItem, type IconName } from "../../utils/searchIndex";

import type { IconProps } from "iconsax-react";

const iconMap: Record<IconName, React.FC<IconProps>> = {
  Home2, Teacher, Profile2User, Briefcase, Book, Book1,
  Calendar, CalendarTick, ClipboardTick, StatusUp, Card,
  MagicStar, Chart, VolumeHigh, Setting2, Setting,
  UserAdd, DocumentUpload, Send, Link2, AddCircle, Trash,
  Refresh, CalendarAdd, TickCircle, Lock, User, UserEdit,
  Logout, Clock, Filter, ProfileTick, Document,
};

/* -------------------------------------------------------------------------- */
/*                           Recent searches storage                           */
/* -------------------------------------------------------------------------- */

const RECENT_KEY = "soma-recent-searches";
const MAX_RECENT = 5;

function getRecentSearches(): SearchItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Purge stale entries (old format stored non-string icons)
    if (!Array.isArray(parsed) || (parsed.length > 0 && typeof parsed[0]?.icon !== "string")) {
      localStorage.removeItem(RECENT_KEY);
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function addRecentSearch(item: SearchItem) {
  const recent = getRecentSearches().filter((r) => r.id !== item.id);
  recent.unshift(item);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

/* -------------------------------------------------------------------------- */
/*                              Search Modal                                  */
/* -------------------------------------------------------------------------- */

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SearchModal = ({ open, onOpenChange }: SearchModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>(getRecentSearches);

  // Filter index by user role (normalized to lowercase)
  const userRole = user?.role?.toLowerCase() ?? "";
  const roleFiltered = searchIndex.filter((item) =>
    item.roles.some((r) => r.toLowerCase() === userRole),
  );

  // Pages and actions
  const pages = roleFiltered.filter((item) => item.category === "page");
  const actions = roleFiltered.filter((item) => item.category === "action");

  const handleSelect = useCallback(
    (item: SearchItem) => {
      addRecentSearch(item);
      setRecentSearches(getRecentSearches());
      onOpenChange(false);
      navigate(item.path);
    },
    [navigate, onOpenChange],
  );

  // Cmd+K global shortcut
  useEffect(() => {
    if (!open) {
      const handler = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          onOpenChange(true);
        }
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open, onOpenChange]);

  // Refresh recent when modal opens
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="center"
        showClose={false}
        className="p-0 gap-0 overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          loop
          className="rounded-2xl"
          filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 h-[56px] border-b border-gray100">
            <SearchNormal variant="Linear" size={22} color="#8C8C8C" />
            <Command.Input
              autoFocus
              placeholder="Search pages, actions..."
              className="flex-1 bg-transparent text-sm text-gray900 placeholder:text-gray400 focus:outline-none"
            />
            <button
              onClick={() => onOpenChange(false)}
              className="text-[11px] text-gray400 border border-gray100 rounded-md px-1.5 py-0.5 font-medium shrink-0"
            >
              ESC
            </button>
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-gray400">
              No results found.
            </Command.Empty>

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <Command.Group heading={<GroupHeading text="Recent" />}>
                {recentSearches.map((item) => (
                  <CommandItem
                    key={`recent-${item.id}`}
                    item={item}
                    onSelect={handleSelect}
                  />
                ))}
              </Command.Group>
            )}

            {/* Pages */}
            {pages.length > 0 && (
              <Command.Group heading={<GroupHeading text="Pages" />}>
                {pages.map((item) => (
                  <CommandItem
                    key={item.id}
                    item={item}
                    onSelect={handleSelect}
                  />
                ))}
              </Command.Group>
            )}

            {/* Actions */}
            {actions.length > 0 && (
              <Command.Group heading={<GroupHeading text="Actions" />}>
                {actions.map((item) => (
                  <CommandItem
                    key={item.id}
                    item={item}
                    onSelect={handleSelect}
                  />
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray100 bg-gray50 flex items-center justify-between text-[11px] text-gray400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white border border-gray100 rounded text-[10px] font-medium">↑</kbd>
                <kbd className="px-1 py-0.5 bg-white border border-gray100 rounded text-[10px] font-medium">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white border border-gray100 rounded text-[10px] font-medium">↵</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-gray100 rounded text-[10px] font-medium">⌘K</kbd>
              search
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                */
/* -------------------------------------------------------------------------- */

function GroupHeading({ text }: { text: string }) {
  return (
    <span className="text-[11px] font-medium text-gray400 uppercase tracking-wider">
      {text}
    </span>
  );
}

function CommandItem({
  item,
  onSelect,
}: {
  item: SearchItem;
  onSelect: (item: SearchItem) => void;
}) {
  const Icon = iconMap[item.icon];

  return (
    <Command.Item
      value={`${item.label} ${item.description} ${item.keywords.join(" ")}`}
      onSelect={() => onSelect(item)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray700 cursor-pointer transition-colors aria-selected:bg-gray900 aria-selected:text-white group"
    >
      <span className="shrink-0 [&_svg]:size-5">
        {Icon ? createElement(Icon, { variant: "Linear", size: 20, color: "currentColor" }) : null}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.label}</p>
        <p className="text-[11px] text-gray400 truncate group-aria-selected:text-gray300">
          {item.description}
        </p>
      </div>
      {item.category === "action" && (
        <span className="shrink-0 text-[10px] font-medium text-gray300 group-aria-selected:text-gray400 bg-gray100 group-aria-selected:bg-gray800 px-1.5 py-0.5 rounded">
          Action
        </span>
      )}
    </Command.Item>
  );
}
