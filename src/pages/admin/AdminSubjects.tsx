import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Add, Book1, Building } from "iconsax-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { HelpHint } from "../../components/ui/HelpHint";
import { SelectDropdown, type SelectOption } from "../../components/ui/select-dropdown";
import {
  useSubjects,
  useClasses,
  useCreateSubject,
  useDeleteSubject,
  useUpdateSubject,
} from "../../features/principal/api";
import {
  SubjectFormModal,
  type SubjectEditTarget,
} from "../../features/principal/components/SubjectFormModal";
import { AssignSubjectsModal } from "../../features/principal/components/AssignSubjectsModal";
import { useClassSubjects, useSaveClassSubjects } from "../../features/class-subjects/api";

const subjectSortOptions: SelectOption[] = [
  { value: "", label: "Sort by" },
  { value: "az", label: "Sort by: A → Z" },
  { value: "za", label: "Sort by: Z → A" },
];

type Tab = "subjects" | "classes";

const isTab = (v: string | null): v is Tab => v === "subjects" || v === "classes";

type SubjectModalState =
  | { mode: "create" }
  | { mode: "edit"; editing: SubjectEditTarget }
  | null;

export const AdminSubjects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: Tab = isTab(rawTab) ? rawTab : "subjects";

  const setTab = (t: Tab) => {
    setSearchParams(t === "subjects" ? {} : { tab: t }, { replace: false });
  };

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-6 flex items-center gap-2">
        {(["subjects", "classes"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t ? "bg-gray900 text-white" : "bg-gray50 text-gray500 hover:bg-accent",
            )}
          >
            {t === "subjects" ? "Subjects" : "Classes & Assignments"}
          </button>
        ))}
      </div>

      {tab === "subjects" ? <SubjectsTab /> : <ClassesTab />}
    </div>
  );
};

const SubjectsTab = () => {
  const { data: subjects, isLoading } = useSubjects();
  const createMutation = useCreateSubject();
  const deleteMutation = useDeleteSubject();
  const updateMutation = useUpdateSubject();
  const [modal, setModal] = useState<SubjectModalState>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = subjects ?? [];
    if (term) {
      list = list.filter(
        (s) => s.name.toLowerCase().includes(term) || (s.code ?? "").toLowerCase().includes(term),
      );
    }
    if (sortOrder === "az" || sortOrder === "za") {
      const dir = sortOrder === "az" ? 1 : -1;
      list = [...list].sort((a, b) => a.name.localeCompare(b.name) * dir);
    }
    return list;
  }, [subjects, searchTerm, sortOrder]);

  const handleCreate = (data: { name: string; code?: string }) => {
    createMutation.mutate(data, { onSuccess: () => setModal(null) });
  };

  const handleEdit = (data: { name: string; code?: string }) => {
    if (!modal || modal.mode !== "edit") return;
    const id = modal.editing.id;
    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () =>
          setModal({ mode: "edit", editing: { ...modal.editing, name: data.name, code: data.code } }),
      },
    );
  };

  const openEdit = (s: SubjectEditTarget) => setModal({ mode: "edit", editing: s });

  const modalOpen = modal !== null;
  const modalMode = modal?.mode ?? "create";
  const modalEditing = modal?.mode === "edit" ? modal.editing : null;

  return (
    <>
      <PageHeader
        title="Subjects"
        hint={
          <HelpHint
            title="Subjects"
            storageKey="subjects"
            description="Set up the subjects your school offers."
            sections={[
              { title: "Add a subject", text: "Tap “Add Subject” and give it a name. Subjects are used in timetables, lesson notes, and CA scoring." },
              { title: "Assign to classes", text: "Use “Assign Subjects” to decide which classes take each subject." },
              { title: "Search & sort", text: "Find a subject by name or sort the list to browse it your way." },
              { title: "Edit or delete", text: "Open a subject to rename it, or remove it if it's no longer taught." },
            ]}
          />
        }
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search subject"
        filters={
          <SelectDropdown
            value={sortOrder}
            onChange={setSortOrder}
            placeholder="Sort by"
            options={subjectSortOptions}
            buttonClassName="h-[45px] text-sm"
            menuClassName="min-w-[180px]"
          />
        }
        mobileFilters={
          <SelectDropdown
            value={sortOrder}
            onChange={setSortOrder}
            placeholder="Sort by"
            options={subjectSortOptions}
            buttonClassName="h-10 text-sm"
            menuClassName="min-w-[200px]"
          />
        }
        actions={<Button onClick={() => setModal({ mode: "create" })}>+ Add Subject</Button>}
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {isLoading ? (
          <p className="text-sm text-gray-400 p-6 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Book1 size={30} variant="Bold" color="#0D0D0D" />}
            title={searchTerm ? "No subjects match your search" : "Add your first subject"}
            description={
              searchTerm
                ? "Try a different search term or clear your filters."
                : "Subjects are assigned to classes and teachers. Add your first subject to get started."
            }
            actionLabel="Add Subject"
            actionIcon={<Add size={16} color="#FFFFFF" variant="Linear" />}
            onAction={() => setModal({ mode: "create" })}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <div key={s.id} className="px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-gray-800 font-medium">{s.name}</p>
                  {s.teachers && s.teachers.length > 0 ? (
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {s.teachers
                        .map(
                          (t) =>
                            `${t.name}${
                              t.classes && t.classes.length > 0
                                ? ` (${t.classes.map((c) => c.name).join(", ")})`
                                : ""
                            }`,
                        )
                        .join("; ")}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-gray-400">No teacher assigned</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {s.code && <span className="text-xs text-gray-400">{s.code}</span>}
                  <button
                    onClick={() => openEdit({ id: s.id, name: s.name, code: s.code ?? "" })}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(s.id)}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SubjectFormModal
        open={modalOpen}
        mode={modalMode}
        editing={modalEditing}
        subjects={subjects ?? []}
        saving={createMutation.isPending || updateMutation.isPending}
        onClose={() => setModal(null)}
        onSubmit={modalMode === "edit" ? handleEdit : handleCreate}
      />
    </>
  );
};

const ClassesTab = () => {
  const navigate = useNavigate();
  const { data: classesData, isLoading: classesLoading } = useClasses();
  const { data: subjects } = useSubjects();
  const { data: assignments, isLoading: assignmentsLoading } = useClassSubjects();
  const saveMutation = useSaveClassSubjects();
  const [modalOpen, setModalOpen] = useState(false);
  const [initialClassIds, setInitialClassIds] = useState<string[]>([]);

  const classes = classesData?.classes ?? [];
  const subjectName = (id: string) => subjects?.find((s) => s.id === id)?.name ?? id;
  const assignmentFor = (classId: string) => assignments.find((a) => a.classId === classId);
  const unassignedCount = classes.filter((c) => (assignmentFor(c.id)?.subjectIds.length ?? 0) === 0).length;
  const assignedCount = classes.length - unassignedCount;
  const pct = classes.length ? Math.round((assignedCount / classes.length) * 100) : 0;

  const sorted = useMemo(
    () =>
      [...classes].sort((a, b) => {
        const aHas = (assignmentFor(a.id)?.subjectIds.length ?? 0) > 0;
        const bHas = (assignmentFor(b.id)?.subjectIds.length ?? 0) > 0;
        if (aHas !== bHas) return aHas ? 1 : -1;
        return a.name.localeCompare(b.name);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classes, assignments],
  );

  const openAssignAll = () => {
    setInitialClassIds([]);
    setModalOpen(true);
  };

  const openAssignFor = (classId: string) => {
    setInitialClassIds([classId]);
    setModalOpen(true);
  };

  const handleSave = (classIds: string[], subjectIds: string[]) => {
    saveMutation.mutate(
      { classIds, subjectIds },
      { onSuccess: () => setModalOpen(false) },
    );
  };

  const loading = classesLoading || assignmentsLoading;

  return (
    <>
      <PageHeader
        title="Classes & Assignments"
        hint={
          <HelpHint
            title="Classes & Assignments"
            storageKey="classes-assignments"
            description="See which subjects are assigned to each class."
            sections={[
              { title: "Assignment overview", text: "The bar shows how many classes already have subjects assigned out of your total." },
              { title: "Assign subjects", text: "Tap “Assign subjects” to bulk-assign subjects to classes, or open a class row to manage its subjects individually." },
              { title: "Unassigned classes", text: "Classes still missing subjects are called out so you know what's left to set up." },
            ]}
          />
        }
        actions={
          <Button onClick={openAssignAll} disabled={classes.length === 0}>
            Assign subjects
          </Button>
        }
      />

      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {assignedCount} of {classes.length} classes have subjects
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {unassignedCount > 0
                ? `${unassignedCount} ${unassignedCount === 1 ? "class" : "classes"} still ${unassignedCount === 1 ? "needs" : "need"} subjects.`
                : "Every class has subjects assigned."}
            </p>
          </div>
          <span className="text-sm font-semibold text-gray-900 tabular-nums">{pct}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gray-900 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <p className="text-sm text-gray-400 p-6 text-center">Loading...</p>
        ) : classes.length === 0 ? (
          <EmptyState
            className="min-h-[280px]"
            icon={<Building size={30} variant="Bold" color="#0D0D0D" />}
            title="No classes yet"
            description="Create a class first, then assign subjects to it."
            actionLabel="Create Class"
            onAction={() => navigate("/admin/classes")}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {sorted.map((c) => {
              const ids = assignmentFor(c.id)?.subjectIds ?? [];
              return (
                <div key={c.id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-gray-800 font-medium">
                      {c.name}
                      {ids.length === 0 && (
                        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-500">
                          No subjects
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {ids.length > 0 ? ids.map(subjectName).join(", ") : "Not assigned yet"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {ids.length} {ids.length === 1 ? "subject" : "subjects"}
                    </span>
                    <button
                      onClick={() => openAssignFor(c.id)}
                      className="text-xs font-medium text-blue-500 hover:text-blue-600"
                    >
                      Assign/Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AssignSubjectsModal
        open={modalOpen}
        classes={classes}
        subjects={subjects ?? []}
        assignments={assignments}
        saving={saveMutation.isPending}
        initialClassIds={initialClassIds}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
};