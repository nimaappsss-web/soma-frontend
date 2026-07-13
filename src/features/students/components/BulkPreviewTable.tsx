import { useCallback } from "react";

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

export const BulkPreviewTable = ({
  rows,
  classes,
  onUpdateRow,
  onRemoveRow,
  onAddRow,
}: BulkPreviewTableProps) => {
  const validCount = rows.filter(isValidRow).length;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-medium text-gray-500 text-xs w-8">#</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500 text-xs">Name *</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500 text-xs">Class *</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500 text-xs w-20">Gender</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500 text-xs w-28">DOB</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500 text-xs">Address</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500 text-xs">Parent Name</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500 text-xs">Parent Phone</th>
              <th className="text-left py-2 px-2 font-medium text-gray-500 text-xs">Parent Email</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <BulkPreviewRow
                key={row._key}
                row={row}
                index={i}
                classes={classes}
                onUpdate={onUpdateRow}
                onRemove={onRemoveRow}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onAddRow}>
          + Add Row
        </Button>
        <span className="text-xs text-gray-400">
          {validCount} / {rows.length} valid
        </span>
      </div>
    </div>
  );
};

interface BulkPreviewRowProps {
  row: BulkStudentRow;
  index: number;
  classes: { id: string; name: string }[];
  onUpdate: (key: string, field: keyof BulkStudentRow, value: string) => void;
  onRemove: (key: string) => void;
}

const BulkPreviewRow = ({ row, index, classes, onUpdate, onRemove }: BulkPreviewRowProps) => {
  const update = useCallback(
    (field: keyof BulkStudentRow, value: string) => onUpdate(row._key, field, value),
    [row._key, onUpdate],
  );

  return (
    <tr className="border-b border-gray-100">
      <td className="py-1.5 px-2 text-gray-400 text-xs">{index + 1}</td>
      <td className="py-1.5 px-2">
        <Input
          value={row.name}
          onChange={(e) => update("name", e.target.value)}
          className={`h-8 text-sm ${!row.name.trim() ? "border-red-300" : ""}`}
        />
      </td>
      <td className="py-1.5 px-2">
        <select
          value={row.classId ?? ""}
          onChange={(e) => update("classId", e.target.value)}
          className={`h-8 w-full rounded-md border px-2 text-sm ${
            !row.classId ? "border-red-300" : "border-input"
          }`}
        >
          <option value="">Select</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </td>
      <td className="py-1.5 px-2">
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
      <td className="py-1.5 px-2">
        <Input
          type="date"
          value={row.dateOfBirth ?? ""}
          onChange={(e) => update("dateOfBirth", e.target.value)}
          className="h-8 text-sm"
        />
      </td>
      <td className="py-1.5 px-2">
        <Input
          value={row.address ?? ""}
          onChange={(e) => update("address", e.target.value)}
          className="h-8 text-sm"
        />
      </td>
      <td className="py-1.5 px-2">
        <Input
          value={row.parentName ?? ""}
          onChange={(e) => update("parentName", e.target.value)}
          className="h-8 text-sm"
        />
      </td>
      <td className="py-1.5 px-2">
        <Input
          value={row.parentPhone ?? ""}
          onChange={(e) => update("parentPhone", e.target.value)}
          className="h-8 text-sm"
        />
      </td>
      <td className="py-1.5 px-2">
        <Input
          value={row.parentEmail ?? ""}
          onChange={(e) => update("parentEmail", e.target.value)}
          className="h-8 text-sm"
        />
      </td>
      <td className="py-1.5 px-2">
        <button onClick={() => onRemove(row._key)} className="text-red-400 hover:text-red-600 text-sm">
          ✕
        </button>
      </td>
    </tr>
  );
};
