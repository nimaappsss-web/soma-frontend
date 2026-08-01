import { Avatar } from "../../../components/ui/Avatar";
import { Input } from "../../../components/ui/input";
import type { Student } from "../../students/types";

interface ScoreListViewProps {
  students: Student[];
  values: Record<string, number | null>;
  maxScore: number;
  onChange: (studentId: string, value: number) => void;
}

export const ScoreListView = ({ students, values, maxScore, onChange }: ScoreListViewProps) => {
  if (students.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray100 divide-y divide-gray100 overflow-hidden">
      {students.map((s) => {
        const current = values[s.id];
        return (
          <div key={s.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={s.name} size={28} />
              <div className="min-w-0">
                <p className="text-gray900 font-medium text-sm truncate">{s.name}</p>
                {s.admissionNo && <p className="text-xs text-gray400 truncate">{s.admissionNo}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray400">/ {maxScore}</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={maxScore}
                value={current === null ? "" : String(current)}
                placeholder="—"
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  onChange(s.id, Number.isFinite(parsed) ? Math.min(maxScore, Math.max(0, parsed)) : 0);
                }}
                className="w-20 sm:w-24 h-11 rounded-full text-center text-base font-semibold px-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
