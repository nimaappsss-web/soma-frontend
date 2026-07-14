import { useState, useMemo, memo } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidRow, type BulkStudentRow } from "../utils/bulkParse";

interface BulkPreviewTableProps {
  rows: BulkStudentRow[];
  classes: { id: string; name: string }[];
  onUpdateRow: (key: string, field: keyof BulkStudentRow, value: string) => void;
  onRemoveRow: (key: string) => void;
  onAddRow: () => void;
}

const PAGE_SIZE = 50;

const getRowErrors = (row: BulkStudentRow): string[] => {
  const errors: string[] = [];
  if (!row.name.trim() || row.name.trim().length < 2) errors.push("Name required (min 2 chars)");
  if (!row.classId) errors.push("Class required");
  return errors;
};

export const BulkPreviewTable = ({
  rows,
  classes,
  onUpdateRow,
  onRemoveRow,
  onAddRow,
}: BulkPreviewTableProps) => {
  const [page, setPage] = useState(1);
  const [showInvalidOnly, setShowInvalidOnly] = useState(false);

  const { validCount, invalidCount, filtered } = useMemo(() => {
    let valid = 0;
    let invalid = 0;
    for (const row of rows) {
      if (isValidRow(row)) valid++;
      else invalid++;
    }
    const f = showInvalidOnly ? rows.filter((r) => !isValidRow(r)) : rows;
    return { validCount: valid, invalidCount: invalid, filtered: f };
  }, [rows, showInvalidOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  if (safePage !== page) setPage(safePage);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onAddRow}>
            + Add Row
          </Button>
          <span className="text-xs text-gray-400">
            <span className="text-green-600 font-medium">{validCount}</span>
            {" / "}
            <span className={invalidCount > 0 ? "text-red-500 font-medium" : ""}>
              {rows.length}
            </span>{" "}
            valid
            {invalidCount > 0 && (
              <span className="text-red-400 ml-1">({invalidCount} with errors)</span>
            )}
          </span>
        </div>

        {invalidCount > 0 && (
          <button
            onClick={() => { setShowInvalidOnly(!showInvalidOnly); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              showInvalidOnly
                ? "bg-red-50 border-red-200 text-red-600"
                : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500"
            }`}
          >
            {showInvalidOnly ? "Show all" : `Show errors only (${invalidCount})`}
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs w-10">#</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs">Name *</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs">Class *</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs w-20">Gender</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs w-28">DOB</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs">Address</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs">Parent Name</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs">Parent Phone</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs">Parent Email</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400 text-sm">
                  {showInvalidOnly ? "No rows with errors" : "No rows"}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <BulkPreviewRow
                  key={row._key}
                  row={row}
                  globalIndex={rows.indexOf(row)}
                  classes={classes}
                  onUpdate={onUpdateRow}
                  onRemove={onRemoveRow}
                  errors={getRowErrors(row)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400">
            {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-2.5 py-1.5 text-xs rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
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
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-2.5 py-1.5 text-xs rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface BulkPreviewRowProps {
  row: BulkStudentRow;
  globalIndex: number;
  classes: { id: string; name: string }[];
  onUpdate: (key: string, field: keyof BulkStudentRow, value: string) => void;
  onRemove: (key: string) => void;
  errors: string[];
}

const BulkPreviewRow = memo(({
  row,
  globalIndex,
  classes,
  onUpdate,
  onRemove,
  errors,
}: BulkPreviewRowProps) => {
  const update = (field: keyof BulkStudentRow, value: string) =>
    onUpdate(row._key, field, value);

  return (
    <tr className={`border-b border-gray-100 ${errors.length > 0 ? "bg-red-50/30" : ""}`}>
      <td className="py-1.5 px-3">
        <span
          className={`text-xs ${errors.length > 0 ? "text-red-500 font-medium cursor-help" : "text-gray-400"}`}
          title={errors.length > 0 ? errors.join("; ") : undefined}
        >
          {errors.length > 0 ? "⚠" : globalIndex + 1}
        </span>
      </td>
      <td className="py-1.5 px-3">
        <Input
          value={row.name}
          onChange={(e) => update("name", e.target.value)}
          className={`h-8 text-sm ${!row.name.trim() || row.name.trim().length < 2 ? "border-red-400" : ""}`}
          placeholder="Full name *"
        />
      </td>
      <td className="py-1.5 px-3">
        <select
          value={row.classId ?? ""}
          onChange={(e) => update("classId", e.target.value)}
          className={`h-8 w-full rounded-md border px-2 text-sm bg-background ${
            !row.classId ? "border-red-400" : "border-input"
          }`}
        >
          <option value="">Select class *</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </td>
      <td className="py-1.5 px-3">
        <select
          value={row.gender ?? ""}
          onChange={(e) => update("gender", e.target.value)}
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">—</option>
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
      </td>
      <td className="py-1.5 px-3">
        <Input
          type="date"
          value={row.dateOfBirth ?? ""}
          onChange={(e) => update("dateOfBirth", e.target.value)}
          className="h-8 text-sm"
        />
      </td>
      <td className="py-1.5 px-3">
        <Input
          value={row.address ?? ""}
          onChange={(e) => update("address", e.target.value)}
          className="h-8 text-sm"
          placeholder="Address"
        />
      </td>
      <td className="py-1.5 px-3">
        <Input
          value={row.parentName ?? ""}
          onChange={(e) => update("parentName", e.target.value)}
          className="h-8 text-sm"
          placeholder="Parent name"
        />
      </td>
      <td className="py-1.5 px-3">
        <Input
          value={row.parentPhone ?? ""}
          onChange={(e) => update("parentPhone", e.target.value)}
          className="h-8 text-sm"
          placeholder="080..."
        />
      </td>
      <td className="py-1.5 px-3">
        <Input
          value={row.parentEmail ?? ""}
          onChange={(e) => update("parentEmail", e.target.value)}
          className="h-8 text-sm"
          placeholder="parent@email.com"
        />
      </td>
      <td className="py-1.5 px-3">
        <button
          onClick={() => onRemove(row._key)}
          className="text-red-400 hover:text-red-600 text-sm transition-colors"
          title="Remove row"
        >
          ✕
        </button>
      </td>
    </tr>
  );
});
BulkPreviewRow.displayName = "BulkPreviewRow";
