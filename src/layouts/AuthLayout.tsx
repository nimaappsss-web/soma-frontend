import { cn } from "@/lib/utils";
import { Link } from "react-router";

interface AuthLayoutProps {
  children: React.ReactNode;
  reverse?: boolean;
}

export const AuthLayout = ({ children, reverse }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-offWhite">
      <header className="flex items-center justify-between bg-pureWhite px-8 h-13.25 lg:px-5">
        <Link to="/" className="flex items-center">
          <img src="/icons/somawordmark_black.svg" alt="Soma" className="h-4" />
        </Link>
        <span className="text-xs text-gray-400">
          Have a question?{" "}
          <a href="#" className="text-gray-600 underline hover:text-gray-900">
            Contact us
          </a>
        </span>
      </header>

      <main className="px-5 pb-5 flex-1 flex flex-col bg-pureWhite">
        <div className={cn("flex-1 flex bg-offWhite rounded-l-[20px]", reverse && "flex-row-reverse")}>
          <div className="w-full lg:w-1/2 flex items-center justify-center rounded-[20px] px-8 py-12">
            <div className="w-full max-w-sm space-y-6">{children}</div>
          </div>
          <div className="hidden lg:flex w-1/2 bg-black rounded-[20px] items-center justify-center p-8">
            <div className="w-full max-w-lg bg-gray-800 rounded-2xl aspect-video flex items-center justify-center">
              <span className="text-gray-500 text-sm">Media content</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};


