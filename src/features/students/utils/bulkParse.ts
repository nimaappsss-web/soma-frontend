import Papa from "papaparse";
import * as XLSX from "xlsx";

import type { CreateStudentPayload } from "../types";

export interface BulkStudentRow {
  _key: string;
  name: string;
  classId?: string;
  gender?: "M" | "F";
  dateOfBirth?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

let keyCounter = 0;
const nextKey = () => `bulk_${++keyCounter}`;

const pick = (raw: Record<string, string>, keys: string[]): string => {
  const lower = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k.toLowerCase().replace(/[\s_-]+/g, ""), v]),
  );
  for (const key of keys) {
    const v = lower[key.toLowerCase().replace(/[\s_-]+/g, "")];
    if (v) return v.trim();
  }
  return "";
};

const toRow = (
  raw: Record<string, string>,
  defaultClassId?: string,
): BulkStudentRow => {
  const row: BulkStudentRow = { _key: nextKey(), name: pick(raw, ["name"]) };
  const genderRaw = pick(raw, ["gender"]).toUpperCase();
  if (genderRaw === "M" || genderRaw === "F") row.gender = genderRaw;
  row.dateOfBirth = pick(raw, ["dateOfBirth", "dateofbirth", "date_of_birth", "dob", "date of birth"]) || undefined;
  row.address = pick(raw, ["address"]) || undefined;
  row.parentName = pick(raw, ["parentName", "parentname", "parent_name", "parent name"]) || undefined;
  row.parentPhone = pick(raw, ["parentPhone", "parentphone", "parent_phone", "parent phone"]) || undefined;
  row.parentEmail = pick(raw, ["parentEmail", "parentemail", "parent_email", "parent email"]) || undefined;
  const classVal = pick(raw, ["classId", "classid", "class_id", "class", "classname", "class name"]);
  row.classId = classVal || defaultClassId;
  return row;
};

export const parseCSV = (
  text: string,
  defaultClassId?: string,
): BulkStudentRow[] => {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  return (result.data as Record<string, string>[]).map((r) => toRow(r, defaultClassId));
};

export const parseExcel = (
  data: ArrayBuffer,
  defaultClassId?: string,
): BulkStudentRow[] => {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });
  return json.map((r) => toRow(r, defaultClassId));
};

export const parseTextarea = (
  input: string,
  defaultClassId?: string,
): BulkStudentRow[] => {
  const lines = input
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const hasComma = line.includes(",");

    if (hasComma) {
      const parts = line.split(",").map((p) => p.trim());
      const row: BulkStudentRow = { _key: nextKey(), name: parts[0] || "" };

      if (parts.length > 1 && (parts[1] === "M" || parts[1] === "F")) {
        row.gender = parts[1];
      }
      if (parts.length > 2) row.parentName = parts[2];
      if (parts.length > 3) row.parentPhone = parts[3];
      if (parts.length > 4) row.parentEmail = parts[4];
      if (parts.length > 5) row.classId = parts[5];

      if (!row.classId && defaultClassId) row.classId = defaultClassId;

      return row;
    }

    return { _key: nextKey(), name: line, classId: defaultClassId };
  });
};

export const toBulkPayload = (rows: BulkStudentRow[]): { students: CreateStudentPayload[] } => ({
  students: rows.map(({ _key: _, ...rest }) => rest),
});

export const isValidRow = (r: BulkStudentRow) => r.name.trim().length >= 2 && !!r.classId;
