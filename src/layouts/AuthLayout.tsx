import { cn } from "@/lib/utils";
import { Link } from "react-router";
import { Logout } from "iconsax-react";

import { useAuth } from "@/contexts/AuthContext";

interface AuthLayoutProps {
  children: React.ReactNode;
  reverse?: boolean;
}

export const AuthLayout = ({ children, reverse }: AuthLayoutProps) => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-offWhite">
      <header className="flex items-center justify-between bg-pureWhite px-8 h-13.25 lg:px-5">
        <Link to="/" className="flex items-center">
          <img src="/icons/somawordmark_black.svg" alt="Soma" className="h-4" />
        </Link>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600"
          >
            <Logout size={14} color="#8C8C8C" />
            Log out
          </button>
        ) : (
          <span className="text-xs text-gray-400">
            Have a question?{" "}
            <a href="#" className="text-gray-600 underline hover:text-gray-900">
              Contact us
            </a>
          </span>
        )}
      </header>

      <main className="px-3 sm:px-5 pb-5 flex-1 flex flex-col bg-pureWhite">
        <div className={cn("flex-1 flex bg-offWhite rounded-l-[20px]", reverse && "flex-row-reverse")}>
          <div className="w-full rounded-[20px] px-3 sm:px-8 py-8 sm:py-12 max-h-[calc(100dvh-5rem)] overflow-y-auto flex flex-col">
            <div className="w-full max-w-sm space-y-6 my-auto mx-auto">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
};


