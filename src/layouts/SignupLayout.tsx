import type { ReactNode } from "react";

interface SignupLayoutProps {
  children: ReactNode;
}

export const SignupLayout = ({ children }: SignupLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-black">
      <div className="hidden lg:flex w-1/2 bg-black items-center justify-center p-8">
        <div className="w-full max-w-lg bg-gray-800 rounded-2xl aspect-video flex items-center justify-center">
          <span className="text-gray-500 text-sm">Media content</span>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-pureWhite rounded-l-[20px]">
        <div className="w-full max-w-[464px]">{children}</div>
      </div>
    </div>
  );
};
