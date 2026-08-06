import { useState, useRef, useCallback, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useBulkCreateStudents } from "../api";
import {
  toBulkPayload,
  isValidRow,
  type BulkStudentRow,
} from "../utils/bulkParse";
import { normalizeName } from "@/utils/dedupe";
import {
  collectDuplicateRows,
  type ExistingStudentRef,
} from "../utils/dedupe";
import { db } from "@/db/db";
import { BulkPreviewTable } from "./BulkPreviewTable";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { parseCSV, parseExcel } from "../utils/bulkParse";
import { DuplicateConfirmDialog } from "@/components/others/DuplicateConfirmDialog";

interface ClassOption {
  id: string;
  name: string;
}

interface BulkAddStudentsProps {
  classes: ClassOption[];
  onClose: () => void;
}

type Step = "upload" | "preview";

export const BulkAddStudents = ({ classes, onClose }: BulkAddStudentsProps) => {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<BulkStudentRow[]>([]);
  const [existingNamesByClass, setExistingNamesByClass] = useState<Map<string, Set<string>>>(new Map());
  const [existingByClass, setExistingByClass] = useState<Map<string, ExistingStudentRef[]>>(new Map());
  const [dupKeys, setDupKeys] = useState<Set<string>>(new Set());
  const [defaultClassId, setDefaultClassId] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [parseError, setParseError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bulkCreate = useBulkCreateStudents();

  useEffect(() => {
    let active = true;
    (async () => {
      const students = await db.students.toArray();
      const map = new Map<string, Set<string>>();
      const refs = new Map<string, ExistingStudentRef[]>();
      for (const s of students) {
        if (!s.classId) continue;
        const set = map.get(s.classId) ?? new Set<string>();
        set.add(normalizeName(s.name));
        map.set(s.classId, set);
        const list = refs.get(s.classId) ?? [];
        list.push({
          id: s.id,
          name: s.name,
          gender: s.gender,
          parentName: s.parentName ?? null,
        });
        refs.set(s.classId, list);
      }
      if (active) {
        setExistingNamesByClass(map);
        setExistingByClass(refs);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const parseFile = useCallback(
    async (f: File) => {
      setParseError("");
      const ext = f.name.split(".").pop()?.toLowerCase();
      try {
        let parsed: BulkStudentRow[] = [];
        if (ext === "csv") {
          const text = await f.text();
          parsed = parseCSV(text, defaultClassId || undefined);
        } else if (ext === "xlsx" || ext === "xls") {
          const buf = await f.arrayBuffer();
          parsed = parseExcel(buf, defaultClassId || undefined);
        } else {
          setParseError("Unsupported file type. Use .csv or .xml.");
          return;
        }
        if (parsed.length === 0) {
          setParseError("No rows found.");
          return;
        }

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
      } catch {
        setParseError("Failed to parse file. Check the format.");
      }
    },
    [defaultClassId, classes],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      parseFile(f);
    },
    [parseFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      parseFile(f);
    },
    [parseFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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

    const duplicates = collectDuplicateRows(valid, existingByClass);
    if (duplicates.size > 0) {
      setDupKeys(duplicates);
      return;
    }

    doImport(valid);
  };

  const doImport = (valid: BulkStudentRow[]) => {
    bulkCreate.mutate(toBulkPayload(valid), {
      onSuccess: () => onClose(),
    });
  };

  const skipDuplicates = () => {
    const clean = rows.filter((r) => !dupKeys.has(r._key));
    setDupKeys(new Set());
    if (clean.filter(isValidRow).length > 0) doImport(clean.filter(isValidRow));
  };

  const importAll = () => {
    const valid = rows.filter(isValidRow);
    setDupKeys(new Set());
    doImport(valid);
  };

  const validCount = rows.filter(isValidRow).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-pureWhite">
      {/* Top border line */}
      <div className="h-px w-full bg-gray-200" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto bg-offWhite">
        {step === "upload" ? (
          <div className="mx-auto max-w-[706px] px-[52px] pt-[81px] pb-8">
            {/* Progress bar */}
            <div className="flex gap-2 mb-8">
              <div className="h-1 flex-1 rounded-full bg-gray900" />
              <div className="h-1 flex-1 rounded-full bg-gray200" />
              <div className="h-1 flex-1 rounded-full bg-gray200" />
            </div>

            {/* Title */}
            <h1 className="text-[32px] font-semibold text-gray-900 mb-3">Import students</h1>

            {/* Description */}
            <p className="text-sm text-gray500 mb-8">
              Download the template provided and fill in your catalog information. More instructions are provided in the file.{" "}
              <a href="/templates/students-bulk-template.csv" download className="text-gray900 font-medium underline underline-offset-2 hover:text-gray700">
                Download template.
              </a>
            </p>

            {/* Class selector */}
            <div className="mb-8">
              <SelectDropdown
                placeholder="Select class (Optional)"
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
                value={defaultClassId}
                onChange={setDefaultClassId}
                className="w-full"
              />
            </div>

            {/* Drag and drop area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-colors mb-8 ${
                isDragging ? "border-gray900 bg-gray100" : "border-gray200 hover:border-gray400"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xml,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#8C8C8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="#8C8C8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 18V12" stroke="#8C8C8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 15L12 12L15 15" stroke="#8C8C8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-sm text-gray500">
                  Drag and drop here or{" "}
                  <span className="text-gray900 font-medium underline underline-offset-2">browse file</span>
                </p>
                <p className="text-xs text-gray500">
                  file type <span className="font-semibold">CSV</span> or <span className="font-semibold">XML</span>
                </p>
              </div>
            </div>

            {parseError && <p className="text-xs text-red-500 mb-4">{parseError}</p>}

            {/* Bottom bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray900">Replace existing item library</span>
                <button
                  type="button"
                  onClick={() => setReplaceExisting(!replaceExisting)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    replaceExisting ? "bg-gray900" : "bg-gray200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      replaceExisting ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <Button disabled className="px-8">
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-[81px] pb-8">
            {/* Progress bar */}
            <div className="flex gap-2 mb-8 px-[52px]">
              <div className="h-1 flex-1 rounded-full bg-gray900" />
              <div className="h-1 flex-1 rounded-full bg-gray900" />
              <div className="h-1 flex-1 rounded-full bg-gray200" />
            </div>

            {/* Header */}
            <div className="px-[52px] mb-6 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-gray900 bg-transparent hover:bg-gray900 hover:text-white transition-colors shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div>
                  <h1 className="text-[32px] font-semibold text-gray900 tracking-tight leading-tight">
                    Confirm Imported Students
                  </h1>
                  <p className="text-sm text-gray500 mt-1">
                    Review and update students information
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={bulkCreate.isPending || validCount === 0}
                className="rounded-full px-6"
              >
                {bulkCreate.isPending ? "Saving..." : "Done"}
              </Button>
            </div>

            <BulkPreviewTable
              rows={rows}
              classes={classes}
              existingNamesByClass={existingNamesByClass}
              onUpdateRow={updateRow}
              onRemoveRow={removeRow}
              onAddRow={addRow}
            />
          </div>
        )}
      </div>

      <DuplicateConfirmDialog
        open={dupKeys.size > 0}
        onOpenChange={(open) => { if (!open) setDupKeys(new Set()); }}
        title="Possible duplicate students"
        description={`${dupKeys.size} row${dupKeys.size === 1 ? "" : "s"} ${dupKeys.size === 1 ? "matches" : "match"} a student already in this class or another row in the list.`}
        highlight="Skipping duplicates imports the remaining students. Importing anyway may create duplicate records."
        confirmLabel={`Import ${dupKeys.size} anyway`}
        secondaryLabel={`Skip ${dupKeys.size}`}
        onConfirm={importAll}
        onSecondary={skipDuplicates}
      >
        <div className="max-h-48 overflow-y-auto space-y-1.5">
          {rows
            .filter((r) => dupKeys.has(r._key))
            .map((r) => (
              <div key={r._key} className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-1.5 text-sm">
                <span className="font-medium text-gray900 truncate">{r.name || "Unnamed"}</span>
                <span className="text-xs text-gray500 shrink-0">
                  {classes.find((c) => c.id === r.classId)?.name ?? "Unknown class"}
                </span>
              </div>
            ))}
        </div>
      </DuplicateConfirmDialog>
    </div>
  );
};
