import { useState, useRef, useEffect } from "react";
import { Logout } from "iconsax-react";

import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "./Avatar";

export const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-full p-1 transition-colors hover:bg-gray50"
      >
        <Avatar name={user?.name ?? "?"} imageUrl={user?.image ?? undefined} size={40} className="bg-gray900 text-white" />
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-tight text-gray900">{user?.name}</p>
          <p className="text-[11px] capitalize leading-tight text-gray400">{user?.role}</p>
        </div>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-[60] w-52 rounded-xl border border-gray100 bg-white p-1.5 shadow-lg">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <Logout size={16} color="#CD432F" /> Log out
          </button>
        </div>
      )}
    </div>
  );
};