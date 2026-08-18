import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Add, ArrowRight, Building, Teacher } from "iconsax-react";
import { SelectDropdown } from "../../components/ui/select-dropdown";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/EmptyState";
import { SomaLoader } from "../../components/ui/SomaLoader";
import { PageHeader } from "../../components/ui/PageHeader";
import { compactSearch } from "../../utils/search";
import { HelpHint } from "../../components/ui/HelpHint";
import { useSchoolSettings } from "../../features/settings/api/useSchoolSettings";
import {
  useClasses,
  useCreateClass,
  useDeleteClass,
  useUpdateClass,
} from "../../features/principal/api";
import {
  ClassFormModal,
  type ClassEditTarget,
} from "../../features/principal/components/ClassFormModal";
import {
  ClassDetailModal,
  type ClassDetailTarget,
} from "../../features/principal/components/ClassDetailModal";
import { schoolTypeLabel } from "../../utils/schoolType";
import type { Class } from "../../features/principal/api/useClasses";

const classSortOptions = [
  { value: "", label: "Sort by" },
  { value: "az", label: "Sort by: A → Z" },
  { value: "za", label: "Sort by: Z → A" },
];

type ClassModalState =
  | { mode: "create" }
  | { mode: "edit"; editing: ClassEditTarget }
  | null;

export const AdminClasses = () => {
  const { data: classesData, isLoading } = useClasses();
  const { data: settings } = useSchoolSettings();
  const createMutation = useCreateClass();
  const deleteMutation = useDeleteClass();
  const updateMutation = useUpdateClass();
  const [searchParams] = useSearchParams();
  const [modal, setModal] = useState<ClassModalState>(() =>
    searchParams.get("add") === "1" ? { mode: "create" } : null,
  );
  const [detailClass, setDetailClass] = useState<ClassDetailTarget | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const filteredClasses = useMemo(() => {
    const term = compactSearch(searchTerm);
    let list = classesData?.classes ?? [];
    if (term) {
      list = list.filter(
        (c) =>
          compactSearch(c.name).includes(term) || compactSearch(c.level).includes(term),
      );
    }
    if (typeFilter) {
      list = list.filter((c) => c.schoolType === typeFilter);
    }
    if (sortOrder === "az" || sortOrder === "za") {
      const dir = sortOrder === "az" ? 1 : -1;
      list = [...list].sort((a, b) => a.name.localeCompare(b.name) * dir);
    }
    return list;
  }, [classesData, searchTerm, typeFilter, sortOrder]);

  const schoolTypeOptions = useMemo(() => {
    const declared = settings?.find((s) => s.key === "schoolType");
    const declaredTypes: string[] = Array.isArray(declared?.value) ? (declared.value as string[]) : [];
    const classTypes = (classesData?.classes ?? [])
      .map((c) => c.schoolType)
      .filter((t): t is string => !!t);
    return [...new Set([...declaredTypes, ...classTypes])]
      .sort()
      .map((t) => ({ value: t, label: schoolTypeLabel(t) }));
  }, [settings, classesData]);

  const handleCreate = (data: { name: string; level: string; arm?: string; schoolType?: string }) => {
    createMutation.mutate(
      { name: data.name, level: data.level, arm: data.arm, schoolType: data.schoolType },
      { onSuccess: () => setModal(null) },
    );
  };

  const handleEdit = (data: { name: string; level: string; arm?: string; schoolType?: string }) => {
    if (!modal || modal.mode !== "edit") return;
    const id = modal.editing.id;
    updateMutation.mutate(
      { id, data: { name: data.name, level: data.level, arm: data.arm } },
      {
        onSuccess: () =>
          setModal({
            mode: "edit",
            editing: { ...modal.editing, name: data.name, level: data.level, arm: data.arm },
          }),
      },
    );
  };

  const openEdit = (c: { id: string; name: string; level: string; arm?: string; schoolType?: string }) =>
    setModal({ mode: "edit", editing: c });

  const toDetailTarget = (c: Class): ClassDetailTarget => ({
    id: c.id,
    name: c.name,
    level: c.level,
    arm: c.arm,
    schoolType: c.schoolType,
    studentCount: c.studentCount,
    formTeacher: c.formTeacher,
  });

  const openDetail = (c: Class) => setDetailClass(toDetailTarget(c));

  const handleDetailEdit = (c: ClassDetailTarget) => {
    setDetailClass(null);
    openEdit({ id: c.id, name: c.name, level: c.level, arm: c.arm ?? "", schoolType: c.schoolType ?? "" });
  };

  const handleDetailDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => setDetailClass(null) });
  };

  const modalOpen = modal !== null;
  const modalMode = modal?.mode ?? "create";
  const modalEditing = modal?.mode === "edit" ? modal.editing : null;

  return (
    <div className="p-4 md:p-6 w-full">
      <PageHeader
        title="Classes"
        hint={
          <HelpHint
            title="Classes"
            storageKey="classes"
            description="Organise your school into classes and assign class teachers."
            sections={[
              { title: "Create a class", text: "Tap “Add Class”, pick the level/type, and give it a name. Classes drive student grouping, attendance, and timetables." },
              { title: "Assign a class teacher", text: "Open a class to assign a teacher who'll manage attendance, lesson notes, and CA for that class." },
              { title: "Search & filter", text: "Use the search bar and type filter to quickly find a class. Sort to arrange them by name or level." },
              { title: "Manage or remove", text: "Open a class to edit its details, or delete it when it's no longer needed." },
            ]}
          />
        }
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search class"
        filters={
          <>
            <SelectDropdown
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="All Types"
              options={[
                { value: "", label: "All Types" },
                ...schoolTypeOptions,
              ]}
              buttonClassName="h-[45px] text-sm"
              menuClassName="min-w-[180px]"
            />
            <SelectDropdown
              value={sortOrder}
              onChange={setSortOrder}
              placeholder="Sort by"
              options={classSortOptions}
              buttonClassName="h-[45px] text-sm"
              menuClassName="min-w-[180px]"
            />
          </>
        }
        mobileFilters={
          <>
            <SelectDropdown
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="All Types"
              options={[
                { value: "", label: "All Types" },
                ...schoolTypeOptions,
              ]}
              buttonClassName="h-10 text-sm"
              menuClassName="min-w-[200px]"
            />
            <SelectDropdown
              value={sortOrder}
              onChange={setSortOrder}
              placeholder="Sort by"
              options={classSortOptions}
              buttonClassName="h-10 text-sm"
              menuClassName="min-w-[200px]"
            />
          </>
        }
        actions={
          <Button onClick={() => setModal({ mode: "create" })}>
            + Add Class
          </Button>
        }
      />
      {isLoading ? (
        <div className="py-6 text-center">
          <SomaLoader label="Loading classes" className="h-8 w-8" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          icon={<Building size={30} variant="Bold" color="#0D0D0D" />}
          title={searchTerm ? "No classes match your search" : "Create your first class"}
          description={
            searchTerm
              ? "Try a different search term or clear your filters."
              : "Classes group students into levels and arms. Add a class to start building your school year."
          }
          actionLabel="Add Class"
          actionIcon={<Add size={16} color="#FFFFFF" variant="Linear" />}
          onAction={() => setModal({ mode: "create" })}
        />
      ) : (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((c) => (
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
                    <p className="truncate font-semibold text-gray900">{c.name}</p>
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

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {c.schoolType && (
                  <span className="rounded-full bg-gray100 px-2.5 py-1 text-[10px] font-medium capitalize text-gray600">
                    {schoolTypeLabel(c.schoolType)}
                  </span>
                )}
                {typeof c.studentCount === "number" && (
                  <span className="rounded-full bg-offWhite px-2.5 py-1 text-xs text-gray500">
                    {c.studentCount} {c.studentCount === 1 ? "student" : "students"}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-1.5 border-t border-gray100 pt-4 text-xs text-gray500">
                <Teacher size={14} color="#8C8C8C" />
                <span className="min-w-0 truncate">
                  {c.formTeacher ? `Class Teacher: ${c.formTeacher.name}` : "No class teacher"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      <ClassFormModal
        open={modalOpen}
        mode={modalMode}
        editing={modalEditing}
        classes={classesData?.classes ?? []}
        schoolTypeOptions={schoolTypeOptions}
        saving={createMutation.isPending || updateMutation.isPending}
        onClose={() => setModal(null)}
        onSubmit={modalMode === "edit" ? handleEdit : handleCreate}
      />
      <ClassDetailModal
        open={detailClass !== null}
        classRecord={detailClass}
        deleting={deleteMutation.isPending}
        detailHref={detailClass ? `/admin/classes/${detailClass.id}` : undefined}
        onClose={() => setDetailClass(null)}
        onEdit={handleDetailEdit}
        onDelete={handleDetailDelete}
      />
    </div>
  );
};