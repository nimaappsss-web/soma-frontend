import { useState, useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useBulkCreateStudents } from "../api";
import {
  toBulkPayload,
  isValidRow,
  type BulkStudentRow,
} from "../utils/bulkParse";
import { normalizeName } from "@/utils/dedupe";
import { db } from "@/db/db";
import { BulkInputView } from "./BulkInputView";
import { BulkPreviewTable } from "./BulkPreviewTable";

interface ClassOption {
  id: string;
  name: string;
}

interface BulkAddStudentsProps {
  classes: ClassOption[];
  onClose: () => void;
}

type Step = "input" | "preview";

export const BulkAddStudents = ({ classes, onClose }: BulkAddStudentsProps) => {
  const [step, setStep] = useState<Step>("input");
  const [rows, setRows] = useState<BulkStudentRow[]>([]);
  const [existingNamesByClass, setExistingNamesByClass] = useState<Map<string, Set<string>>>(new Map());
  const bulkCreate = useBulkCreateStudents();

  useEffect(() => {
    let active = true;
    (async () => {
      const students = await db.students.toArray();
      const map = new Map<string, Set<string>>();
      for (const s of students) {
        if (!s.classId) continue;
        const set = map.get(s.classId) ?? new Set<string>();
        set.add(normalizeName(s.name));
        map.set(s.classId, set);
      }
      if (active) setExistingNamesByClass(map);
    })();
    return () => { active = false; };
  }, []);

  const handleParsed = useCallback((parsed: BulkStudentRow[]) => {
    const classByName = new Map(classes.map((c) => [c.name.toLowerCase().trim(), c.id]));
    const knownIds = new Set(classes.map((c) => c.id));

    const mapped = parsed.map((row) => {
      if (row.classId && !knownIds.has(row.classId)) {
        const matched = classByName.get(row.classId.toLowerCase().trim());
        if (matched) return { ...row, classId: matched };
      }
      return row;
    });

    setRows(mapped);
    setStep("preview");
  }, [classes]);

  const updateRow = useCallback((key: string, field: keyof BulkStudentRow, value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r._key === key
          ? { ...r, [field]: field === "gender" ? (value as "M" | "F" | undefined) || undefined : value }
          : r,
      ),
    );
  }, []);

  const removeRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r._key !== key));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { _key: `bulk_${Date.now()}`, name: "" }]);
  }, []);

  const handleSave = () => {
    const valid = rows.filter(isValidRow);
    if (valid.length === 0) return;

    bulkCreate.mutate(toBulkPayload(valid), {
      onSuccess: () => onClose(),
    });
  };

  const validCount = rows.filter(isValidRow).length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">
          {step === "input" ? "Bulk Add Students" : "Review Students"}
        </h3>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>

      {step === "input" ? (
        <BulkInputView classes={classes} onParsed={handleParsed} />
      ) : (
        <div className="space-y-4">
          <BulkPreviewTable
            rows={rows}
            classes={classes}
            existingNamesByClass={existingNamesByClass}
            onUpdateRow={updateRow}
            onRemoveRow={removeRow}
            onAddRow={addRow}
          />

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={bulkCreate.isPending || validCount === 0}
            >
              {bulkCreate.isPending ? "Saving..." : `Save ${validCount} Students`}
            </button>
            <Button variant="outline" onClick={() => setStep("input")}>
              Back
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
