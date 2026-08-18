import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Add, ArrowRight, Book1, Building, Teacher } from "iconsax-react";
import { cn } from "../../lib/utils";
import { compactSearch } from "../../utils/search";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/EmptyState";
import { SomaLoader } from "../../components/ui/SomaLoader";
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
import {
  SubjectDetailModal,
  type SubjectDetailTarget,
} from "../../features/principal/components/SubjectDetailModal";
import {
  ClassDetailModal,
  type ClassDetailTarget,
} from "../../features/principal/components/ClassDetailModal";
import { AssignSubjectsModal } from "../../features/principal/components/AssignSubjectsModal";
import { useClassSubjects, useSaveClassSubjects } from "../../features/class-subjects/api";
import type { Subject } from "../../features/principal/api/useSubjects";
import type { Class } from "../../features/principal/api/useClasses";

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
      <div className="flex w-fit gap-1 rounded-full bg-gray100 p-1 mb-5">
        {(["subjects", "classes"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium text-center transition-colors whitespace-nowrap",
              tab === t ? "bg-gray900 text-white" : "text-gray500 hover:text-gray700",
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
  const [detailSubject, setDetailSubject] = useState<SubjectDetailTarget | null>(null);
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

  const openDetail = (s: Subject) =>
    setDetailSubject({ id: s.id, name: s.name, code: s.code, teachers: s.teachers });

  const handleDetailEdit = (s: SubjectDetailTarget) => {
    setDetailSubject(null);
    openEdit({ id: s.id, name: s.name, code: s.code ?? "" });
  };

  const handleDetailDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => setDetailSubject(null) });
  };

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
              { title: "Open a subject", text: "Tap a subject card to see which teachers teach it and in which classes, then edit or delete it from there." },
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
      {isLoading ? (
        <div className="py-6 text-center">
          <SomaLoader label="Loading subjects" className="h-8 w-8" />
        </div>
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
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const teacherCount = s.teachers?.length ?? 0;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => openDetail(s)}
                className="group flex flex-col bg-white border border-gray100 rounded-xl p-5 text-left transition-all hover:border-gray-200 hover:shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-offWhite text-gray500">
                      <Book1 size={18} color="#8C8C8C" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray900">{s.name}</p>
                      {s.code && <p className="text-xs text-gray500">{s.code}</p>}
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    color="#8C8C8C"
                    className="shrink-0 text-gray400 transition-colors group-hover:text-gray700"
                  />
                </div>
                <div className="mt-4 flex items-center gap-1.5 border-t border-gray100 pt-4 text-xs text-gray500">
                  <Teacher size={14} color="#8C8C8C" />
                  <span>
                    {teacherCount} {teacherCount === 1 ? "teacher" : "teachers"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <SubjectFormModal
        open={modalOpen}
        mode={modalMode}
        editing={modalEditing}
        subjects={subjects ?? []}
        saving={createMutation.isPending || updateMutation.isPending}
        onClose={() => setModal(null)}
        onSubmit={modalMode === "edit" ? handleEdit : handleCreate}
      />
      <SubjectDetailModal
        open={detailSubject !== null}
        subject={detailSubject}
        deleting={deleteMutation.isPending}
        onClose={() => setDetailSubject(null)}
        onEdit={handleDetailEdit}
        onDelete={handleDetailDelete}
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
  const [searchTerm, setSearchTerm] = useState("");
  const [detailClass, setDetailClass] = useState<{
    record: ClassDetailTarget;
    ids: string[];
  } | null>(null);

  const classes = classesData?.classes ?? [];
  const subjectName = (id: string) => subjects?.find((s) => s.id === id)?.name ?? id;
  const assignmentFor = (classId: string) => assignments.find((a) => a.classId === classId);
  const unassignedCount = classes.filter((c) => (assignmentFor(c.id)?.subjectIds.length ?? 0) === 0).length;
  const assignedCount = classes.length - unassignedCount;
  const pct = classes.length ? Math.round((assignedCount / classes.length) * 100) : 0;

  const filtered = useMemo(() => {
    const term = compactSearch(searchTerm);
    let list = [...classes];
    if (term) {
      list = list.filter(
        (c) => compactSearch(c.name).includes(term) || compactSearch(c.level).includes(term),
      );
    }
    return list.sort((a, b) => {
      const aHas = (assignmentFor(a.id)?.subjectIds.length ?? 0) > 0;
      const bHas = (assignmentFor(b.id)?.subjectIds.length ?? 0) > 0;
      if (aHas !== bHas) return aHas ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, assignments, searchTerm]);

  const openAssignAll = () => {
    setInitialClassIds([]);
    setModalOpen(true);
  };

  const openAssignFor = (classId: string) => {
    setInitialClassIds([classId]);
    setModalOpen(true);
  };

  const openDetail = (c: Class) => {
    setDetailClass({
      record: {
        id: c.id,
        name: c.name,
        level: c.level,
        arm: c.arm,
        schoolType: c.schoolType,
        studentCount: c.studentCount,
        formTeacher: c.formTeacher,
      },
      ids: assignmentFor(c.id)?.subjectIds ?? [],
    });
  };

  const handleAssignFromDetail = (classId: string) => {
    setDetailClass(null);
    openAssignFor(classId);
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
              { title: "Assign subjects", text: "Tap “Assign subjects” to bulk-assign subjects to classes, or open a class card to manage its subjects individually." },
              { title: "Unassigned classes", text: "Classes still missing subjects are called out so you know what's left to set up." },
            ]}
          />
        }
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search class"
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

      {loading ? (
        <div className="py-6 text-center">
          <SomaLoader label="Loading classes" className="h-8 w-8" />
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          className="min-h-[280px]"
          icon={<Building size={30} variant="Bold" color="#0D0D0D" />}
          title="No classes yet"
          description="Create a class first, then assign subjects to it."
          actionLabel="Create Class"
          onAction={() => navigate("/admin/classes")}
        />
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-xl border border-gray100 bg-white p-10 text-center">
          <p className="text-sm font-medium text-gray900">No classes match your search</p>
          <p className="mt-1 text-xs text-gray400">Try a different search term.</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const ids = assignmentFor(c.id)?.subjectIds ?? [];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => openDetail(c)}
                className="group flex flex-col bg-white border border-gray100 rounded-xl p-5 text-left transition-all hover:border-gray-200 hover:shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-offWhite text-gray500">
                      <Building size={18} color="#8C8C8C" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray900">
                        {c.name}
                        {ids.length === 0 && (
                          <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-500">
                            No subjects
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray500">
                        {c.level}
                        {c.arm ? ` · Arm ${c.arm}` : ""}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    color="#8C8C8C"
                    className="shrink-0 text-gray400 transition-colors group-hover:text-gray700"
                  />
                </div>

                {ids.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {ids.slice(0, 3).map((id) => (
                      <span
                        key={id}
                        className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600"
                      >
                        {subjectName(id)}
                      </span>
                    ))}
                    {ids.length > 3 && (
                      <span className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                        +{ids.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-1.5 border-t border-gray100 pt-4 text-xs text-gray500">
                  <Book1 size={14} color="#8C8C8C" />
                  <span>
                    {ids.length} {ids.length === 1 ? "subject" : "subjects"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

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
      <ClassDetailModal
        open={detailClass !== null}
        classRecord={detailClass?.record ?? null}
        assignedSubjectIds={detailClass?.ids}
        subjectName={subjectName}
        onAssign={handleAssignFromDetail}
        onClose={() => setDetailClass(null)}
      />
    </>
  );
};