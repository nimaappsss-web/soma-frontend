import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { SelectDropdown } from "../../components/ui/select-dropdown";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/ui/PageHeader";
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
import { schoolTypeLabel } from "../../utils/schoolType";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const filteredClasses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = classesData?.classes ?? [];
    if (term) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) || c.level.toLowerCase().includes(term),
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

  const modalOpen = modal !== null;
  const modalMode = modal?.mode ?? "create";
  const modalEditing = modal?.mode === "edit" ? modal.editing : null;

  return (
    <div className="p-4 md:p-6 w-full">
      <PageHeader
        title="Classes"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {isLoading ? (
          <p className="text-sm text-gray-400 p-6 text-center">Loading...</p>
        ) : filteredClasses.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">
            {searchTerm ? "No classes match your search." : "No classes yet."}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredClasses.map((c) => (
              <div
                key={c.id}
                className="px-6 py-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <Link
                    to={`/admin/classes/${c.id}`}
                    className="text-gray-800 font-medium hover:text-blue-600"
                  >
                    {c.name}
                  </Link>
                  {c.formTeacher ? (
                    <Link
                      to={`/admin/teachers/${c.formTeacher.id}`}
                      className="block text-xs text-gray-400 mt-0.5 hover:text-blue-600"
                    >
                      Class Teacher: {c.formTeacher.name}
                    </Link>
                  ) : (
                    <span className="block text-xs text-gray-400 mt-0.5">
                      No class teacher
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {c.schoolType && (
                    <span className="text-[10px] font-medium capitalize bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {schoolTypeLabel(c.schoolType)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{c.level}</span>
                  {typeof c.studentCount === "number" && (
                    <span className="text-xs text-gray-400">
                      {c.studentCount} {c.studentCount === 1 ? "student" : "students"}
                    </span>
                  )}
                  <button
                    onClick={() => openEdit({ id: c.id, name: c.name, level: c.level, arm: c.arm ?? "", schoolType: c.schoolType ?? "" })}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
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
    </div>
  );
};