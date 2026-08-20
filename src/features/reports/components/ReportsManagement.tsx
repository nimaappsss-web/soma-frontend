import { useState, useEffect } from "react";

import { useReportSettings, useUpdateReportSettings } from "../../report-card/api";
import { ReportCardPreview } from "../../report-card/components/ReportCardPreview";
import type { ReportTemplate, ReportTheme, ReportSettings } from "../../report-card/types";
import type { StudentAcademicsResponse } from "../../examinations/types";
import { useAuth } from "../../../contexts/AuthContext";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import { HelpHint } from "../../../components/ui/HelpHint";

const TEMPLATES: Array<{ id: ReportTemplate; label: string; description: string }> = [
  { id: "classic", label: "Classic", description: "Portrait table layout" },
  { id: "modern", label: "Modern", description: "Colored header card" },
  { id: "compact", label: "Compact", description: "Dense, minimal" },
];

const THEMES: Array<{ id: ReportTheme; label: string; hex: string }> = [
  { id: "slate", label: "Slate", hex: "#0D0D0D" },
  { id: "emerald", label: "Emerald", hex: "#059669" },
  { id: "indigo", label: "Indigo", hex: "#4F46E5" },
  { id: "amber", label: "Amber", hex: "#D97706" },
];

const SAMPLE_REPORT: StudentAcademicsResponse = {
  studentId: "sample",
  term: "first",
  session: "2026/2027",
  average: 78.4,
  bestSubject: { name: "Mathematics", score: 88 },
  worstSubject: { name: "English", score: 64 },
  attendancePercentage: 92.5,
  position: 3,
  classSize: 24,
  subjects: [
    { subjectId: "1", subjectName: "Mathematics", scores: [], caTotal: 22, examScore: 66, total: 88, grade: "A", teacherName: "Mr. Ade" },
    { subjectId: "2", subjectName: "English", scores: [], caTotal: 18, examScore: 46, total: 64, grade: "C", teacherName: "" },
    { subjectId: "3", subjectName: "Basic Science", scores: [], caTotal: 20, examScore: 53, total: 73, grade: "B", teacherName: "" },
    { subjectId: "4", subjectName: "Social Studies", scores: [], caTotal: 17, examScore: 58, total: 75, grade: "A", teacherName: "" },
    { subjectId: "5", subjectName: "PHE", scores: [], caTotal: 19, examScore: 55, total: 74, grade: "B", teacherName: "" },
  ],
};

export const ReportsManagement = () => {
  const { settings, isLoading } = useReportSettings();
  const updateSettings = useUpdateReportSettings();
  const { user } = useAuth();

  const [draft, setDraft] = useState<ReportSettings>(settings);

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings?.template, settings?.theme]);

  const dirty = draft.template !== settings.template || draft.theme !== settings.theme;

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="group flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-gray900">Report Card</h1>
            <HelpHint
              title="Report Card"
              storageKey="report-card"
              description="Choose the template and theme used for every student report card across the school."
              sections={[
                { title: "Template", text: "Pick how the report card is laid out — the options are shown with a live preview." },
                { title: "Theme", text: "Choose the colour style for the whole report card design." },
                { title: "Save", text: "Tap “Save Design” to apply your choice to every report card generated for students." },
              ]}
            />
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Choose the template and theme used for every student report card across the school.
          </p>
        </div>
        <Button size="sm" disabled={!dirty || updateSettings.isPending} onClick={() => updateSettings.mutate(draft)}>
          {updateSettings.isPending ? "Saving..." : "Save Design"}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-900">Template</p>
            <p className="text-xs text-gray-400 mt-0.5">How the report card is laid out</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDraft((d) => ({ ...d, template: t.id }))}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    draft.template === t.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm font-semibold text-gray-900">Theme</p>
            <p className="text-xs text-gray-400 mt-0.5">Accent color of the report card</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setDraft((d) => ({ ...d, theme: th.id }))}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    draft.theme === th.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: th.hex }} />
                  {th.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-900">Preview</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-4">Sample student shown with the selected design</p>
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-100 border-t-gray-900 mx-auto" />
            </div>
          ) : (
            <ReportCardPreview
              template={draft.template}
              theme={draft.theme}
              report={SAMPLE_REPORT}
              studentName="Ada Obi"
              admissionNo="ATH/2026/003"
              className="JSS 3 GOLD"
              schoolName="Sample Academy"
              logoUrl={user?.logoUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
};
