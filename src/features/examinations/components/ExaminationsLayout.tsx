import { Outlet } from "react-router";

export const ExaminationsLayout = () => {
  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 md:p-6 pb-0 w-full">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray900">CA &amp; Examinations</h1>
        </div>
        <p className="text-sm text-gray500 mb-4">Set up the CA &amp; exam score scheme for each subject</p>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};
