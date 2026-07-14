import { useState, useMemo } from "react";
import { Link } from "react-router";

import { useAuth } from "../../contexts/AuthContext";
import { useTeacherProfile } from "../../features/teacher/api";
import {
  useLessonNotes,
  saveLessonNote,
  deleteLessonNote,
  useCurriculumSubjects,
  useCurriculumTopics,
  useGenerateLessonNote,
} from "../../features/lesson-notes/api";
import type { LessonNote, GenerateResponse } from "../../features/lesson-notes/types";
import toast from "react-hot-toast";

const genId = () => crypto.randomUUID();

const emptyContent = (): GenerateResponse => ({
  subject: "", className: "", term: "", week: 0, topic: "", duration: "",
  topicSummary: "", backgroundInfo: "", behaviouralObjectives: [],
  instructionalMaterials: [], previousKnowledge: "", introduction: "",
  presentationSteps: [], evaluation: "", conclusion: "", assignment: "", remarks: "",
});

type FieldType = "textarea" | "list" | "steps";

const FIELD_ORDER: Array<{ key: keyof GenerateResponse; label: string; type: FieldType }> = [
  { key: "duration", label: "Duration", type: "textarea" },
  { key: "topicSummary", label: "Topic Summary", type: "textarea" },
  { key: "backgroundInfo", label: "Background Information", type: "textarea" },
  { key: "behaviouralObjectives", label: "Behavioural Objectives", type: "list" },
  { key: "instructionalMaterials", label: "Instructional Materials", type: "list" },
  { key: "previousKnowledge", label: "Previous Knowledge", type: "textarea" },
  { key: "introduction", label: "Introduction / Set Induction", type: "textarea" },
  { key: "presentationSteps", label: "Presentation Steps", type: "steps" },
  { key: "evaluation", label: "Evaluation", type: "textarea" },
  { key: "conclusion", label: "Conclusion", type: "textarea" },
  { key: "assignment", label: "Assignment / Homework", type: "textarea" },
  { key: "remarks", label: "Remarks", type: "textarea" },
];

export const TeacherLessonNotes = () => {
  const { user, logout } = useAuth();
  const { formClass, schoolName, name, role } = useTeacherProfile();
  const notes = useLessonNotes(user?.id ?? "");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [className, setClassName] = useState(formClass ?? "");
  const [subjectName, setSubjectName] = useState("");
  const [week, setWeek] = useState(0);
  const [term, setTerm] = useState(1);
  const [content, setContent] = useState<GenerateResponse>(emptyContent());
  const [saving, setSaving] = useState(false);

  const { data: subjects = [] } = useCurriculumSubjects(className);
  const { data: topics = [] } = useCurriculumTopics(className, subjectName);
  const { generate, generating } = useGenerateLessonNote();
  const online = navigator.onLine;

  const editNote = editingId ? notes.find((n) => n.id === editingId) : null;

  const weekOptions = useMemo(() => {
    const seen = new Set<number>();
    return topics.filter((t: { week: number }) => {
      if (seen.has(t.week)) return false;
      seen.add(t.week);
      return true;
    });
  }, [topics]);

  const newNote = () => {
    setEditingId(null);
    setClassName(formClass ?? "");
    setSubjectName("");
    setWeek(0);
    setTerm(1);
    setContent(emptyContent());
  };

  const openNote = (note: LessonNote) => {
    setEditingId(note.id);
    setClassName(note.className);
    setSubjectName(note.subjectName);
    setWeek(note.week);
    setTerm(note.term);
    setContent({ ...note.content });
  };

  const handleGenerate = async () => {
    if (!subjectName || !className || !week) { toast.error("Select class, subject and week"); return; }
    try {
      const result = await generate({ subjectName, className, week, term });
      if (result) {
        setContent(result);
        setEditingId(null);
        toast.success("Lesson plan generated!");
      }
    } catch {
      toast.error("Generation failed — check connection");
    }
  };

  const updateField = (key: keyof GenerateResponse, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const updateList = (key: "behaviouralObjectives" | "instructionalMaterials", value: string) => {
    setContent((prev) => ({
      ...prev,
      [key]: value.split("\n").filter(Boolean),
    }));
  };

  const updateStep = (index: number, field: string, value: string) => {
    setContent((prev) => {
      const steps = prev.presentationSteps.map((s) => ({ ...s }));
      steps[index] = { ...steps[index], [field]: value };
      return { ...prev, presentationSteps: steps };
    });
  };

  const addStep = () => {
    setContent((prev) => ({
      ...prev,
      presentationSteps: [
        ...prev.presentationSteps,
        { step: prev.presentationSteps.length + 1, time: "", teacherActivity: "", studentActivity: "" },
      ],
    }));
  };

  const removeStep = (index: number) => {
    setContent((prev) => ({
      ...prev,
      presentationSteps: prev.presentationSteps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, step: i + 1 })),
    }));
  };

  const handleSave = async () => {
    if (!subjectName || !className) { toast.error("Subject and class required"); return; }
    if (!content.topic) { toast.error("Generate a plan or enter a topic"); return; }
    setSaving(true);
    try {
      const note: LessonNote = {
        id: editingId ?? genId(),
        userId: user!.id,
        subjectName,
        className,
        term,
        week,
        topic: content.topic,
        date: new Date().toISOString().split("T")[0],
        content,
        createdAt: editNote?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      };
      await saveLessonNote(note);
      setEditingId(note.id);
      toast.success("Lesson note saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    await deleteLessonNote(editingId, user!.id);
    setEditingId(null);
    setContent(emptyContent());
    toast.success("Deleted");
  };

  const renderField = (field: (typeof FIELD_ORDER)[number]) => {
    const val = content[field.key];

    if (field.type === "list") {
      const text = Array.isArray(val) ? (val as string[]).join("\n") : "";
      return (
        <div key={field.key}>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            {field.label} <span className="text-gray-400 font-normal normal-case">(one per line)</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => updateList(field.key as "behaviouralObjectives" | "instructionalMaterials", e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-y"
          />
        </div>
      );
    }

    if (field.type === "steps") {
      const steps = Array.isArray(val) ? (val as GenerateResponse["presentationSteps"]) : [];
      return (
        <div key={field.key}>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
            {field.label}
          </label>
          {steps.map((s, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Step {s.step}</span>
                <button onClick={() => removeStep(i)} className="text-xs text-red-500 hover:text-red-600">Remove</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-0.5">Time</label>
                  <input value={s.time} onChange={(e) => updateStep(i, "time", e.target.value)} className="w-full h-8 rounded border border-gray-200 px-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-0.5">Teacher Activity</label>
                  <textarea value={s.teacherActivity} onChange={(e) => updateStep(i, "teacherActivity", e.target.value)} rows={2} className="w-full rounded border border-gray-200 px-2 py-1 text-xs resize-y" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-0.5">Student Activity</label>
                  <textarea value={s.studentActivity} onChange={(e) => updateStep(i, "studentActivity", e.target.value)} rows={2} className="w-full rounded border border-gray-200 px-2 py-1 text-xs resize-y" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addStep} className="text-xs text-blue-600 hover:text-blue-700">+ Add Step</button>
        </div>
      );
    }

    return (
      <div key={field.key}>
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
          {field.label}
        </label>
        <textarea
          value={String((val as string) ?? "")}
          onChange={(e) => updateField(field.key, e.target.value)}
          rows={field.key === "topicSummary" || field.key === "backgroundInfo" || field.key === "previousKnowledge" || field.key === "introduction" ? 3 : 2}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-y"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{schoolName}</span>
          <span className="text-sm text-gray-700">{name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">{role}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">Sign out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link to="/teach" className="text-sm text-gray-400 hover:text-gray-600">&larr; Dashboard</Link>
        <h2 className="text-2xl font-bold text-gray-800 mt-1 mb-6">Lesson Notes</h2>

        <div className="flex gap-6">
          <div className="w-56 shrink-0">
            <button
              onClick={newNote}
              className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + New Note
            </button>
            <div className="space-y-1">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openNote(note)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    editingId === note.id
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <p className="font-medium truncate">{note.topic || "Untitled"}</p>
                  <p className="text-xs text-gray-400 truncate">{note.subjectName} · Wk {note.week}</p>
                </button>
              ))}
              {notes.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No notes yet</p>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Class</label>
                  <select
                    value={className}
                    onChange={(e) => { setClassName(e.target.value); setSubjectName(""); setWeek(0); }}
                    className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                  >
                    <option value="">Select class</option>
                    {formClass && <option value={formClass}>{formClass}</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Subject</label>
                  <select
                    value={subjectName}
                    onChange={(e) => { setSubjectName(e.target.value); setWeek(0); }}
                    disabled={!className}
                    className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm disabled:opacity-50"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Week</label>
                  <select
                    value={week}
                    onChange={(e) => setWeek(Number(e.target.value))}
                    disabled={!subjectName}
                    className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm disabled:opacity-50"
                  >
                    <option value={0}>Select week</option>
                    {weekOptions.map((t: { week: number; topic: string }) => (
                      <option key={t.week} value={t.week}>Week {t.week} — {t.topic}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !online || !week}
                    className="w-full h-10 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
                  >
                    {generating ? "Generating..." : online ? "Generate with AI" : "Offline"}
                  </button>
                </div>
              </div>

              {content.topic && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">{content.topic}</p>
                  <p className="text-xs text-blue-600">{content.subject} · {content.className} · {content.term} · Week {content.week} · {content.duration}</p>
                </div>
              )}

              <div className="space-y-4">
                {FIELD_ORDER.map(renderField)}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-green-700"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                {editingId && (
                  <button onClick={handleDelete} className="px-4 py-2 text-red-500 text-sm hover:text-red-600">
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
