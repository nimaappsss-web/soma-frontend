import { useState, useMemo, memo } from "react";

import { Input } from "@/components/ui/input";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { DateInput } from "@/components/ui/date-input";
import { Checkbox } from "@/components/ui/checkbox";
import { isValidRow, type BulkStudentRow } from "../utils/bulkParse";
import { normalizeName } from "@/utils/dedupe";

interface BulkPreviewTableProps {
  rows: BulkStudentRow[];
  classes: { id: string; name: string }[];
  existingNamesByClass?: Map<string, Set<string>>;
  onUpdateRow: (key: string, field: keyof BulkStudentRow, value: string) => void;
  onRemoveRow: (key: string) => void;
  onAddRow: () => void;
}

const PAGE_SIZE = 32;

const getRowErrors = (row: BulkStudentRow): string[] => {
  const errors: string[] = [];
  if (!row.name.trim() || row.name.trim().length < 2) errors.push("Name required (min 2 chars)");
  if (!row.classId) errors.push("Class required");
  return errors;
};

export const BulkPreviewTable = ({
  rows,
  classes,
  existingNamesByClass,
  onUpdateRow,
  onRemoveRow,
  onAddRow,
}: BulkPreviewTableProps) => {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const warnings = useMemo(() => {
    const map = new Map<string, string[]>();
    const seen = new Map<string, string>();

    for (const row of rows) {
      if (!isValidRow(row) || !row.classId) continue;
      const key = `${normalizeName(row.name)}::${row.classId}`;
      const prior = seen.get(key);
      if (prior) {
        map.set(row._key, [...(map.get(row._key) ?? []), "Same name as another row in this list"]);
        if (!map.has(prior)) map.set(prior, []);
        map.set(prior, [...(map.get(prior) ?? []), "Same name as another row in this list"]);
        continue;
      }
      seen.set(key, row._key);

      if (existingNamesByClass?.get(row.classId)?.has(normalizeName(row.name))) {
        map.set(row._key, [...(map.get(row._key) ?? []), "Name already exists in this class"]);
      }
    }

    return map;
  }, [rows, existingNamesByClass]);

  const { validCount, invalidCount, duplicateCount } = useMemo(() => {
    let valid = 0;
    let invalid = 0;
    for (const row of rows) {
      if (isValidRow(row)) valid++;
      else invalid++;
    }
    const dupSet = new Set<string>();
    for (const list of warnings.values()) list.forEach((w) => dupSet.add(w));
    return { validCount: valid, invalidCount: invalid, duplicateCount: dupSet.size };
  }, [rows, warnings]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  if (safePage !== page) setPage(safePage);

  const allSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r._key));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageRows.map((r) => r._key)));
    }
  };

  return (
    <div className="px-[52px]">
      {/* Stats badges */}
      <div className="flex items-center gap-3 mb-6">
        <span className="rounded-full bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5">
          {validCount} / {rows.length} valid
        </span>
        {duplicateCount > 0 && (
          <span className="rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5">
            {duplicateCount} possible duplicate{duplicateCount > 1 ? "s" : ""}
          </span>
        )}
        {invalidCount > 0 && (
          <span className="rounded-full bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5">
            {invalidCount} with error(s)
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
              </th>
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs">Student ID</th>
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs">First Name</th>
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs">Last Name</th>
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs">Class</th>
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs">Gender</th>
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs">Date of Birth</th>
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs">Guardian</th>
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs">Guardian Email</th>
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs">Contact</th>
              <th className="text-left py-3 px-3 font-medium text-gray500 text-xs">Address</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-8 text-gray400 text-sm">
                  No rows
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <BulkPreviewRow
                  key={row._key}
                  row={row}
                  classes={classes}
                  onUpdate={onUpdateRow}
                  onRemove={onRemoveRow}
                  errors={getRowErrors(row)}
                  warnings={warnings.get(row._key)}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Add row button */}
        <div className="p-3">
          <button
            onClick={onAddRow}
            className="flex items-center gap-1.5 text-sm text-gray500 border border-dashed border-gray300 rounded-lg px-4 py-2 hover:bg-gray50 transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add row
          </button>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-xs text-gray500">
          <span>Showing</span>
          <span className="font-medium text-gray900">{PAGE_SIZE}</span>
          <span>rows per page</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="w-7 h-7 flex items-center justify-center text-xs rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (safePage <= 4) {
                pageNum = i + 1;
              } else if (safePage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = safePage - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 text-xs rounded-md transition-colors ${
                    pageNum === safePage
                      ? "bg-gray900 text-white"
                      : "border border-gray-200 hover:bg-gray-50 text-gray600"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="w-7 h-7 flex items-center justify-center text-xs rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface BulkPreviewRowProps {
  row: BulkStudentRow;
  classes: { id: string; name: string }[];
  onUpdate: (key: string, field: keyof BulkStudentRow, value: string) => void;
  onRemove: (key: string) => void;
  errors: string[];
  warnings?: string[];
}

const BulkPreviewRow = memo(({
  row,
  classes,
  onUpdate,
  onRemove,
  errors,
  warnings,
}: BulkPreviewRowProps) => {
  const update = (field: keyof BulkStudentRow, value: string) =>
    onUpdate(row._key, field, value);

  return (
    <tr className={`border-b border-gray-100 ${errors.length > 0 ? "bg-red-50/30" : (warnings?.length ?? 0) > 0 ? "bg-amber-50/40" : ""}`}>
      <td className="py-2 px-3">
        <Checkbox />
      </td>
      <td className="py-2 px-3">
        <span className="text-xs text-gray400 font-mono">—</span>
      </td>
      <td className="py-2 px-3">
        <Input
          value={row.name.split(" ")[0] ?? row.name}
          onChange={(e) => {
            const last = row.name.split(" ").slice(1).join(" ");
            update("name", last ? `${e.target.value} ${last}` : e.target.value);
          }}
          className={`h-8 text-sm ${!row.name.trim() || row.name.trim().length < 2 ? "border-red-400" : ""}`}
          placeholder="First name"
        />
      </td>
      <td className="py-2 px-3">
        <Input
          value={row.name.split(" ").slice(1).join(" ")}
          onChange={(e) => {
            const first = row.name.split(" ")[0] ?? "";
            update("name", e.target.value ? `${first} ${e.target.value}` : first);
          }}
          className="h-8 text-sm"
          placeholder="Last name"
        />
      </td>
      <td className="py-2 px-3">
        <SelectDropdown
          placeholder="Select class *"
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          value={row.classId ?? ""}
          onChange={(v) => update("classId", v)}
          buttonClassName={`h-8 rounded-md px-2 text-sm ${!row.classId ? "border-red-400" : ""}`}
        />
      </td>
      <td className="py-2 px-3">
        <SelectDropdown
          placeholder="—"
          options={[
            { value: "M", label: "M" },
            { value: "F", label: "F" },
          ]}
          value={row.gender ?? ""}
          onChange={(v) => update("gender", v)}
          buttonClassName="h-8 rounded-md px-2 text-sm"
        />
      </td>
      <td className="py-2 px-3">
        <DateInput
          value={row.dateOfBirth ?? ""}
          onChange={(v) => update("dateOfBirth", v)}
          className="h-8 text-sm"
        />
      </td>
      <td className="py-2 px-3">
        <Input
          value={row.parentName ?? ""}
          onChange={(e) => update("parentName", e.target.value)}
          className="h-8 text-sm"
          placeholder="Guardian name"
        />
      </td>
      <td className="py-2 px-3">
        <Input
          value={row.parentEmail ?? ""}
          onChange={(e) => update("parentEmail", e.target.value)}
          className="h-8 text-sm"
          placeholder="parent@email.com"
        />
      </td>
      <td className="py-2 px-3">
        <Input
          value={row.parentPhone ?? ""}
          onChange={(e) => update("parentPhone", e.target.value)}
          className="h-8 text-sm"
          placeholder="080..."
        />
      </td>
      <td className="py-2 px-3">
        <Input
          value={row.address ?? ""}
          onChange={(e) => update("address", e.target.value)}
          className="h-8 text-sm"
          placeholder="Address"
        />
      </td>
      <td className="py-2 px-3">
        <button
          onClick={() => onRemove(row._key)}
          className="text-gray400 hover:text-red-500 text-sm transition-colors"
          title="Remove row"
        >
          ✕
        </button>
      </td>
    </tr>
  );
});
BulkPreviewRow.displayName = "BulkPreviewRow";
