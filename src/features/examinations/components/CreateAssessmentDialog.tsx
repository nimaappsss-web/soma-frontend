import { useState, useMemo } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { DateInput } from "../../../components/ui/date-input";
import { Label } from "../../../components/ui/label";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { useClasses } from "../../principal/api/useClasses";
import { useSubjects } from "../../principal/api/useSubjects";
import { useExamComponents } from "../api/useExamComponents";
import { useCreateExam } from "../api/useCreateExam";
import { useActiveTerm } from "../../calendar/api";
import { useHolidays } from "../../calendar/api";
import { useAcademicTerms } from "../../calendar/api";
import { checkExamDate, dateReasonMessage } from "../utils/dateValidation";
import type { ExamComponentType, ExamDateRejection } from "../types";

const TYPE_OPTIONS: { value: ExamComponentType; label: string }[] = [
  { value: "TEST", label: "Test" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "PROJECT", label: "Project" },
  { value: "PRACTICAL", label: "Practical" },
  { value: "EXAM", label: "Exam" },
  { value: "PHYSICAL", label: "Physical" },
  { value: "OTHER", label: "Other" },
];

interface CreateAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  defaultClassId?: string;
}

export const CreateAssessmentDialog = ({ open, onClose, defaultClassId }: CreateAssessmentDialogProps) => {
  const { activeTerm } = useActiveTerm();
  const term = activeTerm?.term ?? "first";

  const { data: classesData } = useClasses();
  const { data: subjectsData } = useSubjects();
  const { data: termsData } = useAcademicTerms();
  const { data: holidaysData } = useHolidays();
  const createMutation = useCreateExam();

  const [classId, setClassId] = useState(defaultClassId ?? "");
  const [subjectId, setSubjectId] = useState("");
  const [componentId, setComponentId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<ExamComponentType>("TEST");
  const [maxScore, setMaxScore] = useState("");
  const [date, setDate] = useState("");
  const [dateRejection, setDateRejection] = useState<ExamDateRejection | null>(null);

  const selectedClass = (classesData?.classes ?? []).find((c) => c.id === classId);
  const classSchoolType = selectedClass?.schoolType ?? "";
  const { data: schemeData } = useExamComponents(term, undefined, classSchoolType);
  const components = schemeData?.components ?? [];

  const holidayDates = useMemo(() => holidaysData?.holidays?.map((h) => h.date) ?? [], [holidaysData]);
  const terms = termsData?.terms ?? [];

  const selectedComponent = components.find((c) => c.id === componentId);
  const resolvedMaxScore = componentId
    ? String(selectedComponent?.maxScore ?? "")
    : maxScore;

  const dateCheck = useMemo(() => {
    if (!date) return null;
    return checkExamDate(date, { holidayDates, terms });
  }, [date, holidayDates, terms]);

  const handleDateChange = (value: string) => {
    setDate(value);
    const check = value ? checkExamDate(value, { holidayDates, terms }) : null;
    setDateRejection(check?.valid ? null : (check?.reason ?? null));
  };

  const handleComponentChange = (value: string) => {
    setComponentId(value);
    const comp = components.find((c) => c.id === value);
    if (comp) {
      setType(comp.type);
      setMaxScore(String(comp.maxScore));
      if (!name) setName(comp.name);
    }
  };

  const reset = () => {
    setClassId(defaultClassId ?? "");
    setSubjectId("");
    setComponentId("");
    setName("");
    setType("TEST");
    setMaxScore("");
    setDate("");
    setDateRejection(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit =
    classId && subjectId && date && dateCheck?.valid && (componentId || (name.trim() && Number(maxScore) > 0));

  const handleSubmit = () => {
    if (!canSubmit) return;
    createMutation.mutate(
      {
        name: (name.trim() || selectedComponent?.name) ?? "",
        type,
        subjectId,
        classId,
        componentId: componentId || undefined,
        term,
        maxScore: componentId ? undefined : Number(maxScore),
        date,
      },
      {
        onSuccess: () => handleClose(),
        onError: (err) => {
          const reason = (err as { response?: { data?: { reason?: { type: ExamDateRejection } } } })
            ?.response?.data?.reason?.type;
          if (reason) setDateRejection(reason);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent variant="middle" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New assessment</DialogTitle>
          <DialogDescription>
            Schedule a CA or exam for a subject and class.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <SelectDropdown
                options={(classesData?.classes ?? []).map((c) => ({ value: c.id, label: c.name }))}
                value={classId}
                onChange={setClassId}
                placeholder="Select class"
                searchable
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <SelectDropdown
                options={(subjectsData ?? []).map((s) => ({ value: s.id, label: s.name }))}
                value={subjectId}
                onChange={setSubjectId}
                placeholder="Select subject"
                searchable
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Component (optional)</Label>
            <SelectDropdown
              options={components.map((c) => ({
                value: c.id,
                label: `${c.name} · ${c.maxScore} marks`,
              }))}
              value={componentId}
              onChange={handleComponentChange}
              placeholder="Link to a configured component"
              searchable
            />
            {!componentId && (
              <p className="text-xs text-gray500">Pick a component to auto-fill name, type, and max score.</p>
            )}
            {classId && classSchoolType && components.length === 0 && (
              <p className="text-xs text-amber500">
                No mark types are configured for {classSchoolType} classes. You can still create a custom assessment.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Test 1"
                disabled={!!componentId}
              />
            </div>
            <div className="space-y-2">
              <Label>Max score</Label>
              <Input
                type="number"
                min={1}
                value={resolvedMaxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="e.g. 20"
                disabled={!!componentId}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <SelectDropdown
              options={TYPE_OPTIONS}
              value={type}
              onChange={(v) => setType(v as ExamComponentType)}
              disabled={!!componentId}
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <DateInput
              value={date}
              onChange={handleDateChange}
            />
            {dateRejection && (
              <p className="text-xs text-red500">{dateReasonMessage(dateRejection)}</p>
            )}
            {date && dateCheck?.valid && (
              <p className="text-xs text-springgreen600">Valid school day.</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="w-full" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!canSubmit || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create assessment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
