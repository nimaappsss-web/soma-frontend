import { useMemo, useState } from "react";
import { Send2, TickCircle, Warning2, Setting2, CloseCircle } from "iconsax-react";
import { cn } from "@/lib/utils";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/button";
import { useBroadcastCa } from "../api";
import { BroadcastConfirmModal, BroadcastNote } from "./BroadcastConfirmModal";
import type { BroadcastStatusResponse, BroadcastScope, BroadcastStudent } from "../types";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const CaScoreChip = ({
  name,
  score,
  maxScore,
}: {
  name: string;
  score: number | null;
  maxScore: number;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
      score !== null
        ? "border-gray100 bg-offWhite text-gray700"
        : "border-red500/30 bg-red500/5 text-red500",
    )}
  >
    {name}
    {score !== null ? (
      <>
        <span className="font-semibold text-gray900">{score}</span>
        <span className="font-normal text-gray400">/{maxScore}</span>
      </>
    ) : (
      <span className="font-semibold">—</span>
    )}
  </span>
);

const CaStudentRow = ({ student }: { student: BroadcastStudent }) => (
  <div className="rounded-2xl border border-gray100 bg-white p-4">
    <div className="flex items-start gap-3">
      <Avatar name={student.studentName} size={40} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray900">{student.studentName}</p>
            <p className="truncate text-xs text-gray500">{student.admissionNo || "—"}</p>
          </div>
          {student.caComplete ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-springgreen600/10 px-2 py-0.5 text-[11px] font-semibold text-springgreen600">
              <TickCircle size={12} variant="Bold" color="#34A853" />
              Complete
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber500/10 px-2 py-0.5 text-[11px] font-semibold text-amber500">
              <Warning2 size={12} variant="Bold" color="#FBBC05" />
              Missing
            </span>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {student.subjects
            .filter((s) => s.caComponents.length > 0)
            .map((s) => (
              <div key={s.subjectId} className="flex items-center gap-1.5 rounded-xl bg-offWhite px-2.5 py-1.5">
                <span className="text-[11px] font-semibold text-gray900">{s.subjectName}</span>
                <span className="flex flex-wrap gap-1">
                  {s.caComponents.map((c) => (
                    <CaScoreChip
                      key={c.componentId ?? c.componentName}
                      name={c.componentName.replace(/^Test\s/, "T")}
                      score={c.score}
                      maxScore={c.maxScore}
                    />
                  ))}
                </span>
              </div>
            ))}
        </div>

        {student.caMissingComponents.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {student.caMissingComponents.map((m) => (
              <span
                key={m.subjectName}
                className="inline-flex items-center gap-1 rounded-full bg-red500/5 px-2 py-0.5 text-[11px] font-medium text-red500"
              >
                <CloseCircle size={12} variant="Bold" color="#CD432F" />
                {m.componentNames.join(", ")} · {m.subjectName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const CaBroadcastSection = ({
  status,
  scope,
}: {
  status: BroadcastStatusResponse;
  scope: BroadcastScope;
}) => {
  const [selected, setSelected] = useState<string[]>(() =>
    status.components.map((c) => c.id),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const broadcastMutation = useBroadcastCa();

  const scoredComponentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of status.students) {
      for (const subj of s.subjects) {
        for (const c of subj.caComponents) {
          if (c.score !== null && c.componentId) ids.add(c.componentId);
        }
      }
    }
    return ids;
  }, [status.students]);

  const hasAnyScores = status.hasCaSessions;

  const completeCount = status.students.filter((s) => s.caComplete).length;
  const totalCount = status.students.length;
  const pct = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0;

  const selectedComponents = status.components.filter((c) => selected.includes(c.id));
  const selectedNames = selectedComponents.map((c) => c.name).join(", ");

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const canBroadcast =
    hasAnyScores && selectedComponents.length > 0 && selectedComponents.every((c) => scoredComponentIds.has(c.id));

  const handleConfirm = () => {
    broadcastMutation.mutate(
      { ...scope, componentIds: selected },
      {
        onSuccess: () => setConfirmOpen(false),
      },
    );
  };

  return (
    <div className="space-y-4">
      {!hasAnyScores ? (
        <div className="rounded-2xl border border-gray100 bg-white p-8 text-center">
          <Setting2 size={24} className="mx-auto text-gray300 mb-2" variant="Bold" />
          <p className="text-sm font-medium text-gray900">No CA scores yet</p>
          <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
            Once CA scores are saved in Mark Scores, they'll show up here so you can broadcast them to parents.
          </p>
        </div>
      ) : (
        <>
          {/* Configuration */}
          <div className="rounded-2xl border border-gray100 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Setting2 size={16} variant="Bold" color="#0D0D0D" />
              <p className="text-sm font-semibold text-gray900">Choose what to broadcast</p>
            </div>
            <p className="text-xs text-gray500 mt-1">
              Select the mark types to include. The selected scores are colated per student and sent straight to
              parents — no principal approval needed.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {status.components.map((c) => {
                const active = selected.includes(c.id);
                const hasData = scoredComponentIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => hasData && toggle(c.id)}
                    disabled={!hasData}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border h-10 px-4 text-sm font-medium transition-all active:scale-95",
                      active
                        ? "border-gray900 bg-gray900 text-white"
                        : "bg-white text-gray700 border-gray100 hover:border-gray200",
                      !hasData && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", hasData ? "bg-springgreen600" : "bg-gray300")} />
                    {c.name}
                    <span className={cn("text-xs", active ? "text-gray300" : "text-gray400")}>· {c.maxScore}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-gray100 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray900">
                  {completeCount} of {totalCount} student{totalCount === 1 ? "" : "s"} have all CA scores
                </p>
                <p className="text-xs text-gray500 mt-0.5">
                  Students with missing scores still receive the tests that are marked — or complete them first.
                </p>
              </div>
              <p className={cn("text-lg font-bold", pct === 100 ? "text-springgreen600" : "text-gray900")}>
                {pct}%
              </p>
            </div>
            <div className="mt-3 h-1.5 bg-gray100 rounded-full overflow-hidden">
              <div
                className={cn("h-full bg-gray900 rounded-full transition-all duration-500", pct === 100 && "bg-springgreen600")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Last broadcast state */}
          {status.caBroadcast && (
            <div className="rounded-2xl border border-springgreen600/30 bg-springgreen600/5 p-4">
              <div className="flex items-start gap-2.5">
                <TickCircle size={18} variant="Bold" color="#34A853" className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-springgreen600">CA results broadcast to parents</p>
                  <p className="text-xs text-gray600 mt-0.5">
                    Last sent {formatTime(status.caBroadcast.broadcastAt)} · includes{" "}
                    {status.caBroadcast.componentIds
                      .map((id) => status.components.find((c) => c.id === id)?.name)
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Broadcast CTA */}
          <div className="sticky bottom-4 z-10">
            <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-gray100 bg-white/95 backdrop-blur p-3 sm:p-4 shadow-lg shadow-gray900/5">
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-sm font-semibold text-gray900">
                  {status.caBroadcast ? "Broadcast again?" : "Ready to share with parents?"}
                </p>
                <p className="text-xs text-gray500 truncate">
                  {canBroadcast ? selectedNames : "Select mark types with scores to broadcast"}
                </p>
              </div>
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={!canBroadcast || broadcastMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Send2 size={16} variant="Bold" color="#FFFFFF" />
                {broadcastMutation.isPending
                  ? "Broadcasting…"
                  : status.caBroadcast
                    ? "Broadcast again"
                    : "Broadcast to parents"}
              </Button>
            </div>
          </div>

          {/* Student list */}
          <div className="space-y-2.5">
            {status.students.map((s) => (
              <CaStudentRow key={s.studentId} student={s} />
            ))}
          </div>
        </>
      )}

      <BroadcastConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        eyebrow="You are about to broadcast"
        title="Send CA results to parents?"
        confirmLabel="Broadcast to parents"
        busy={broadcastMutation.isPending}
        busyLabel="Broadcasting…"
        onConfirm={handleConfirm}
        confirmVariant="default"
      >
        <div className="space-y-3">
          <BroadcastNote>
            <span className="font-semibold">{selectedNames}</span> will be sent to every parent of{" "}
            <span className="font-semibold">{status.className}</span>. CA results don't need principal approval —
            parents will see these scores right away.
          </BroadcastNote>
          <p className="text-sm text-gray500">
            Parents of {status.students.length} student{status.students.length === 1 ? "" : "s"} in this class will be
            notified. Only scores that have been recorded are shared — students or subjects still being marked simply
            get what's done, and you can broadcast again anytime after saving the rest.
          </p>
        </div>
      </BroadcastConfirmModal>
    </div>
  );
};