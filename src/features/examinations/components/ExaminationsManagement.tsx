import { ClipboardText } from "iconsax-react";

export const ExaminationsManagement = () => {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900">Examinations</h1>
      <p className="text-sm text-gray-400 mt-1">Manage exams, continuous assessments, and grading</p>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6 text-center">
        <ClipboardText size={32} className="mx-auto text-gray-200 mb-3" variant="Bold" />
        <p className="text-sm text-gray-400">Examinations management coming soon</p>
        <p className="text-xs text-gray-300 mt-1">Set up exam sessions, record CA scores, compute term results, and generate report cards</p>
      </div>
    </div>
  );
};
