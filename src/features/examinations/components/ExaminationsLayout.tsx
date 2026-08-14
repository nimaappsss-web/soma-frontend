import { Outlet } from "react-router";

import { HelpHint } from "../../../components/ui/HelpHint";

export const ExaminationsLayout = () => {
  return (
    <div className="flex flex-col min-h-full">
      <div className="p-4 md:p-6 pb-0 w-full">
        <div className="group flex items-center gap-2.5 mb-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray900">CA &amp; Examinations</h1>
          <HelpHint
            title="CA &amp; Examinations"
            storageKey="ca-examinations"
            description="Set up the CA &amp; exam score scheme for each subject."
            sections={[
              { title: "Configure schemes", text: "Define how many CA tests and exams each subject has, and how they're weighed." },
              { title: "Apply to subjects", text: "Set a scheme per subject — these drive how scores are recorded and averaged." },
              { title: "Where it shows", text: "The scheme you configure here is what teachers use when marking scores." },
            ]}
          />
        </div>
        <p className="text-sm text-gray500 mb-4">Set up the CA &amp; exam score scheme for each subject</p>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};
