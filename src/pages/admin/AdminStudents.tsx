import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { Add, AddSquare, ArrowDown2, Profile2User, Trash } from "iconsax-react";
import { Avatar } from "../../components/ui/Avatar";
import { Checkbox } from "../../components/ui/checkbox";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAuth } from "../../contexts/AuthContext";
import { useAllStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useBulkDeleteStudents } from "../../features/students/api";
import { BulkAddStudents } from "../../features/students/components/BulkAddStudents";
import { AddStudentDialog } from "../../features/students/components/AddStudentDialog";
import { StudentFormDialog } from "../../features/students/components/StudentFormDialog";
import { StudentPageHeader, type StudentViewMode } from "../../features/students/components/StudentPageHeader";
import { HelpHint } from "../../components/ui/HelpHint";
import { useClasses } from "../../features/principal/api";
import { findDuplicateStudents, type StudentDuplicate } from "../../features/students/utils/dedupe";
import type { Student, CreateStudentPayload, UpdateStudentPayload } from "../../features/students/types";
import { DuplicateConfirmDialog } from "../../components/others/DuplicateConfirmDialog";
import { DeleteConfirmDialog } from "../../components/others/DeleteConfirmDialog";
import { CelebrationDecor } from "../../components/ui/CelebrationDecor";
import { getCelebration } from "../../utils/celebrations";
import { cn } from "../../lib/utils";
type ViewMode = StudentViewMode;
const VIEW_STORAGE_KEY = "soma:admin:students-view";
const readView = (): ViewMode =>
  localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";

const getLastName = (name: string) => name.trim().split(/\s+/).pop() ?? "";
const getFirstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export const AdminStudents = () => {
  const { user } = useAuth();
  const { data: classesData } = useClasses();
  const { data: allStudents, isLoading } = useAllStudents(user?.id ?? "");
  const [searchParams] = useSearchParams();
  const [classFilter, setClassFilter] = useState(() => searchParams.get("classId") ?? "");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<ViewMode>(readView);
  const setViewMode = (next: ViewMode) => {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };
  const createMutation = useCreateStudent();
  const deleteMutation = useDeleteStudent();
  const bulkDeleteMutation = useBulkDeleteStudents();
  const updateMutation = useUpdateStudent();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [dupState, setDupState] = useState<{ payload: CreateStudentPayload; matches: StudentDuplicate[] } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = allStudents;
    if (classFilter) result = result.filter((s) => s.classId === classFilter);
    if (statusFilter) result = result.filter((s) => s.status === statusFilter);
    const term = searchTerm.trim().toLowerCase();
    if (term) result = result.filter((s) => s.name.toLowerCase().includes(term));
    const sorted = [...result];
    if (sortOrder === "az") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOrder === "za") sorted.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortOrder === "last-first") sorted.sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)));
    else if (sortOrder === "first-last") sorted.sort((a, b) => getFirstName(a.name).localeCompare(getFirstName(b.name)));
    return sorted;
  }, [allStudents, classFilter, statusFilter, searchTerm, sortOrder]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)),
    );
  }, [filtered]);
  const handleDelete = (s: Student) => {
    setDeleteTarget(s);
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteOpen(true);
  };
  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set());
        setBulkDeleteOpen(false);
      },
    });
  };
  useEffect(() => { setSelectedIds(new Set()); }, [classFilter]);

  const onAddStudent = async (payload: CreateStudentPayload) => {
    const dups = await findDuplicateStudents({
      name: payload.name,
      classId: payload.classId,
      gender: payload.gender,
      parentName: payload.parentName,
    });
    if (dups.length > 0) {
      setDupState({ payload, matches: dups });
      return;
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowAddDialog(false);
      },
    });
  };
  const confirmCreate = () => {
    if (!dupState) return;
    createMutation.mutate(dupState.payload, {
      onSuccess: () => {
        setShowAddDialog(false);
        setDupState(null);
      },
    });
  };
  const startEditing = (s: Student) => {
    setEditingStudent(s);
    setShowBulk(false);
  };
  const handleUpdateSubmit = (payload: Record<string, unknown>) => {
    if (!editingStudent) return;
    updateMutation.mutate(
      { id: editingStudent.id, data: payload as UpdateStudentPayload },
      { onSuccess: () => setEditingStudent(null) },
    );
  };
  return (
    <div className="p-4 md:p-6 w-full">
      <StudentPageHeader
        title="Students"
        classOptions={(classesData?.classes ?? []).map((c) => ({ value: c.id, label: c.name }))}
        classValue={classFilter}
        onClassChange={setClassFilter}
        statusValue={statusFilter}
        onStatusChange={setStatusFilter}
        sortValue={sortOrder}
        onSortChange={setSortOrder}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        view={view}
        onViewChange={setViewMode}
        hint={
          <HelpHint
            title="Students"
            storageKey="students"
            description="Manage every student in your school from one place."
            sections={[
              { title: "What you can do", text: "Add students individually or import them in bulk, edit profiles, transfer or withdraw, and generate admission numbers." },
              { title: "Search & filter", text: "Use the search bar, class filter, and status dropdown to narrow the list. Switch between list and grid views." },
              { title: "Bulk actions", text: "Select multiple students with the checkboxes to run bulk actions like import or delete." },
              { title: "Admission numbers", text: "Generate admission numbers automatically for students who don't have one yet." },
            ]}
          />
        }
        actions={
          <div ref={addMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAddOpen((o) => !o)}
              className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-gray900 px-4 text-sm font-medium text-white hover:bg-gray800"
            >
              <Add size={20} color="#FFFFFF" variant="Linear" />
              Add Student
              <ArrowDown2 size={14} color="#FFFFFF" className={cn("transition-transform", addOpen && "rotate-180")} />
            </button>
            {addOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-input bg-white p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => { setAddOpen(false); setShowAddDialog(true); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-gray800 transition-colors hover:bg-accent"
                >
                  <Add size={16} color="#0D0D0D" />
                  Add Student
                </button>
                <button
                  type="button"
                  onClick={() => { setAddOpen(false); setShowBulk(true); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-gray800 transition-colors hover:bg-accent"
                >
                  <AddSquare size={16} color="#0D0D0D" />
                  Bulk Import
                </button>
              </div>
            )}
          </div>
        }
      />
      {showBulk && (
        <BulkAddStudents
          classes={classesData?.classes ?? []}
          onClose={() => setShowBulk(false)}
        />
      )}

      <AddStudentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        classes={(classesData?.classes ?? []).map((c) => ({ value: c.id, label: c.name }))}
        isSaving={createMutation.isPending}
        onSubmit={onAddStudent}
      />

      {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-6 py-3">
            <span className="text-sm text-gray-500">{selectedIds.size} selected</span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 disabled:opacity-50"
            >
              <Trash size={14} variant="Bold" color="#CD432F" />
              {bulkDeleteMutation.isPending ? "Deleting..." : `Delete (${selectedIds.size})`}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
{isLoading ? (
          <p className="text-sm text-gray-400 p-6 text-center rounded-xl border border-gray100 bg-white">Loading...</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Profile2User size={30} variant="Bold" color="#0D0D0D" />}
            title={
              searchTerm
                ? "No students match your search"
                : classFilter
                  ? "No students in this class"
                  : "Add your first student"
            }
            description={
              searchTerm
                ? "Try a different search term or clear your filters."
                : classFilter
                  ? "No students have been added to this class yet. Add one or change your class filter."
                  : "Students keep their scores, attendance and reports in one place. Add your first student to get started."
            }
            actionLabel="Add Student"
            actionIcon={<Add size={16} color="#FFFFFF" variant="Linear" />}
            onAction={() => setShowAddDialog(true)}
          />
        ) : view === "grid" ? (
          <>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-400">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => toggleSelectAll()}
                aria-label={allSelected ? "Deselect all" : "Select all"}
              />
              <span>{allSelected ? "Deselect all" : "Select all"}</span>
              {selectedIds.size > 0 && (
                <span className="text-gray-500">({selectedIds.size} selected)</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {filtered.map((s) => {
              const className = classesData?.classes.find((c) => c.id === s.classId)?.name;
              const celeb = getCelebration(s.dateOfBirth, "birthday");
              return (
                <div
                  key={s.id}
                  className="group relative overflow-hidden rounded-tl-3xl rounded-tr-[28px] rounded-br-3xl rounded-bl-[28px] border border-gray100 bg-white p-6 pt-9 transition-all hover:-translate-y-0.5 hover:border-gray300 hover:shadow-[0_16px_30px_-14px_rgba(0,0,0,0.18)]"
                >
                  {celeb && <CelebrationDecor type={celeb.type} years={celeb.years} />}
                  <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.06)_0%,transparent_70%)]" />
                  <div className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.05)_0%,transparent_70%)]" />
                  <img
                    src="/icons/somawordmark_black.svg"
                    alt=""
                    className="pointer-events-none absolute -bottom-2 -right-3 w-28 opacity-[0.12] transition-opacity group-hover:opacity-20"
                  />
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => toggleSelect(s.id)}
                    aria-label={`Select ${s.name}`}
                    className="absolute top-5 right-5 z-20"
                  />
                  <div className="relative flex flex-col items-center pt-2">
                    <Link
                      to={`/admin/students/${s.id}`}
                      className="relative flex flex-col items-center"
                      aria-label={`View ${s.name}`}
                    >
                      <div className="absolute -inset-2.5 rounded-full bg-gradient-to-br from-black/10 via-transparent to-black/5 blur-md" />
                      <Avatar
                        name={s.name}
                        size={72}
                        className="relative border-2 border-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.2)] ring-1 ring-black/5"
                      />
                      <p className="mt-5 w-full truncate text-center text-[15px] font-semibold text-gray900">
                        {s.name}
                      </p>
                    </Link>
                    {s.admissionNo && (
                      <p className="mt-1 w-full truncate text-center text-xs text-gray500">{s.admissionNo}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                      {className && (
                        <span className="rounded-full bg-offWhite px-3 py-1.5 text-[11px] font-medium text-gray500">
                          {className}
                        </span>
                      )}
                      <span className="rounded-full bg-offWhite px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-gray500">
                        {s.gender ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray100">
            <div className="divide-y divide-gray-100">
            <div className="px-6 py-3 flex items-center gap-3 text-xs text-gray-400 font-medium">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => toggleSelectAll()}
                aria-label={allSelected ? "Deselect all" : "Select all"}
              />
              <span>{allSelected ? "Deselect all" : "Select all"}</span>
            </div>
            {filtered.map((s) => {
              const className = classesData?.classes.find(c => c.id === s.classId)?.name;
              return (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedIds.has(s.id)}
                      onCheckedChange={() => toggleSelect(s.id)}
                      aria-label={`Select ${s.name}`}
                      className="shrink-0"
                    />
                    <Avatar name={s.name} size={32} />
                    <div>
                      <Link to={`/admin/students/${s.id}`} className="text-gray-800 font-medium hover:text-blue-600">
                        {s.name}
                      </Link>
                      {s.admissionNo && <span className="ml-2 text-xs text-gray-400">{s.admissionNo}</span>}
                      {className && <span className="ml-2 text-xs text-blue-500">{className}</span>}
                      {s.parentPhone && (
                        <span className="ml-3 text-xs text-gray-400">{s.parentName ?? "—"} · {s.parentPhone}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{s.gender ?? "—"}</span>
                    <button
                      onClick={() => startEditing(s)}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Delete student"
                    >
                      <Trash size={16} variant="Bold" color="#8C8C8C" />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      <DuplicateConfirmDialog
        open={!!dupState}
        onOpenChange={(open) => { if (!open) setDupState(null); }}
        title="Student with this name already exists"
        description={dupState
          ? `"${dupState.payload.name}" is already in ${classesData?.classes.find(c => c.id === classFilter)?.name ?? "this class"}.`
          : ""}
        highlight="Check the existing record before adding — it may be the same person or a different student with the same name."
        confirmLabel="Add anyway"
        onConfirm={confirmCreate}
      >
        {dupState && (
          <div className="space-y-2">
            {dupState.matches.map((m) => (
              <div key={m.id} className="rounded-lg border border-gray100 bg-gray50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray900">{m.name}</span>
                  <span
                    className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                      m.exact ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {m.exact ? "Exact match" : "Similar"}
                  </span>
                </div>
                <div className="text-xs text-gray500 mt-1 space-y-0.5">
                  {m.admissionNo && <p>Admission: {m.admissionNo}</p>}
                  <p>Gender: {m.gender ?? "—"}</p>
                  {m.parentName && (
                    <p>Parent: {m.parentName}{m.parentPhone ? ` · ${m.parentPhone}` : ""}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DuplicateConfirmDialog>
      <StudentFormDialog
        open={!!editingStudent}
        onOpenChange={(open) => { if (!open) setEditingStudent(null); }}
        student={editingStudent}
        classes={(classesData?.classes ?? []).map((c) => ({ value: c.id, label: c.name }))}
        isSaving={updateMutation.isPending}
        onSubmit={handleUpdateSubmit}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete student"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmInputLabel="Type the student name to confirm"
        confirmInputPlaceholder={deleteTarget?.name ?? ""}
        confirmInputValue={deleteTarget?.name ?? ""}
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        onConfirm={confirmDelete}
      />
      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => { if (!open) setBulkDeleteOpen(false); }}
        title={`Delete ${selectedIds.size} student${selectedIds.size > 1 ? "s" : ""}`}
        description={`Are you sure you want to delete ${selectedIds.size} student${selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmInputLabel="Type your first name to confirm"
        confirmInputPlaceholder={user?.name?.split(" ")[0] ?? ""}
        confirmInputValue={user?.name?.split(" ")[0] ?? ""}
        confirmLabel={bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
};
