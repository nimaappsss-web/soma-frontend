import { useState, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { PageHeader } from "../../components/ui/PageHeader";
import { SelectDropdown, type SelectOption } from "../../components/ui/select-dropdown";
import {
  useSubjects,
  useCreateSubject,
  useDeleteSubject,
  useUpdateSubject,
} from "../../features/principal/api";
import {
  SubjectFormModal,
  type SubjectEditTarget,
} from "../../features/principal/components/SubjectFormModal";

const subjectSortOptions: SelectOption[] = [
  { value: "", label: "Sort by" },
  { value: "az", label: "Sort by: A → Z" },
  { value: "za", label: "Sort by: Z → A" },
];

type SubjectModalState =
  | { mode: "create" }
  | { mode: "edit"; editing: SubjectEditTarget }
  | null;

export const AdminSubjects = () => {
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
    <div className="p-4 md:p-6 w-full">
      <PageHeader
        title="Subjects"
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
        actions={
          <Button onClick={() => setModal({ mode: "create" })}>
            + Add Subject
          </Button>
        }
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {isLoading ? (
          <p className="text-sm text-gray-400 p-6 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 p-6 text-center">{searchTerm ? "No subjects match your search." : "No subjects yet."}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                <span className="text-gray-800 font-medium">{s.name}</span>
                <div className="flex items-center gap-3">
                  {s.code && <span className="text-xs text-gray-400">{s.code}</span>}
                  <button
                    onClick={() => openEdit({ id: s.id, name: s.name, code: s.code ?? "" })}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteMutation.mutate(s.id)} className="text-xs text-red-500 hover:text-red-600">
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
    </div>
  );
};