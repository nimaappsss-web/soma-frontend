import { useState, useRef, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { BulkStudentRow } from "../utils/bulkParse";
import { parseCSV, parseExcel, parseTextarea } from "../utils/bulkParse";

interface BulkInputViewProps {
  classes: { id: string; name: string }[];
  onParsed: (rows: BulkStudentRow[]) => void;
}

type InputMode = "file" | "paste";

export const BulkInputView = ({ classes, onParsed }: BulkInputViewProps) => {
  const [mode, setMode] = useState<InputMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [rawInput, setRawInput] = useState("");
  const [defaultClassId, setDefaultClassId] = useState("");
  const [parseError, setParseError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(
    async (f: File) => {
      setParseError("");
      const ext = f.name.split(".").pop()?.toLowerCase();

      try {
        let rows: BulkStudentRow[] = [];
        if (ext === "csv") {
          const text = await f.text();
          rows = parseCSV(text, defaultClassId || undefined);
        } else if (ext === "xlsx" || ext === "xls") {
          const buf = await f.arrayBuffer();
          rows = parseExcel(buf, defaultClassId || undefined);
        } else {
          setParseError("Unsupported file type. Use .csv, .xlsx, or .xls.");
          return;
        }
        if (rows.length === 0) { setParseError("No rows found."); return; }
        onParsed(rows);
      } catch {
        setParseError("Failed to parse file. Check the format.");
      }
    },
    [defaultClassId, onParsed],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setFile(f);
      parseFile(f);
    },
    [parseFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      setFile(f);
      parseFile(f);
    },
    [parseFile],
  );

  const handlePasteParse = useCallback(() => {
    if (!rawInput.trim()) return;
    const rows = parseTextarea(rawInput, defaultClassId || undefined);
    if (rows.length === 0) return;
    onParsed(rows);
  }, [rawInput, defaultClassId, onParsed]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="default-class" className="text-xs text-gray-500 mb-1 block">
          Default Class <span className="text-gray-400 font-normal">(can override per row in preview)</span>
        </Label>
        <select
          id="default-class"
          value={defaultClassId}
          onChange={(e) => setDefaultClassId(e.target.value)}
          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
        >
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setMode("file")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "file" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setMode("paste")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === "paste" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Paste Data
        </button>
      </div>

      {mode === "file" ? (
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">
            Upload CSV or Excel file
          </Label>
          <p className="text-xs text-gray-400 mb-2">
            Expected columns: <code className="bg-gray-100 px-1 rounded">name, classId, gender, dateOfBirth, parentName, parentPhone, parentEmail</code>
          </p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div>
                <p className="text-sm font-medium text-blue-600">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB — Parsing...</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 font-medium">Drop a file here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">CSV, XLSX, or XLS</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <Label htmlFor="bulk-input" className="text-xs text-gray-500 mb-1 block">
            Paste student data (one per line)
          </Label>
          <p className="text-xs text-gray-400 mb-2">
            Simple: one name per line. Or CSV: <code className="bg-gray-100 px-1 rounded">name, classId, gender, dateOfBirth, parentName, parentPhone, parentEmail</code>
          </p>
          <textarea
            id="bulk-input"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={`Chidi Okonkwo\nAmina Bello, F\nEmeka Okafor, M, Mr. Okafor, 08012345678`}
            rows={8}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-y font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-3">
            <Button onClick={handlePasteParse} disabled={!rawInput.trim()}>
              Preview ({rawInput.trim().split("\n").filter(Boolean).length} lines)
            </Button>
          </div>
        </div>
      )}

      {parseError && <p className="text-xs text-red-500">{parseError}</p>}
    </div>
  );
};
