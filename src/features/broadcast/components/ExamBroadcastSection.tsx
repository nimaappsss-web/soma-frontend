import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Send2,
  TickCircle,
  Warning2,
  Clock,
  Check,
  CloseCircle,
  ShieldTick,
  Refresh2,
} from "iconsax-react";
import { cn } from "@/lib/utils";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/button";
import { useSubmitExamSheet, useResendExamResults } from "../api";
import { BroadcastConfirmModal, BroadcastNote } from "./BroadcastConfirmModal";
import { StudentListSection } from "./StudentListSection";
import type { BroadcastStatusResponse, BroadcastScope, BroadcastStudent } from "../types";

const formatTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "—";

const ExamScoreChip = ({
  subjectName,
  score,
  maxScore,
}: {
  subjectName: string;
  score: number | null;
  maxScore: number | null;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
      score !== null
        ? "border-gray100 bg-offWhite text-gray700"
        : "border-red500/30 bg-red500/5 text-red500",
    )}
  >
    <span className="font-semibold text-gray900">{subjectName}</span>
    {score !== null ? (
      <>
        <span className="font-semibold">{score}</span>
        <span className="font-normal text-gray400">/{maxScore ?? "—"}</span>
      </>
    ) : (
      <span className="font-semibold">—</span>
    )}
  </span>
);

const ExamStudentRow = ({
  student,
  delivered,
  canResend,
  resending,
  onResend,
  onOpen,
}: {
  student: BroadcastStudent;
  delivered: boolean;
  canResend: boolean;
  resending: boolean;
  onResend: () => void;
  onOpen: () => void;
}) => (
  <div
    className="cursor-pointer rounded-2xl border border-gray100 bg-white p-4 transition-colors hover:border-gray200"
    onClick={onOpen}
    role="link"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter") onOpen();
    }}
  >
    <div className="flex items-start gap-3">
      <Avatar name={student.studentName} size={40} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray900">{student.studentName}</p>
            <p className="truncate text-xs text-gray500">{student.admissionNo || "—"}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {student.examComplete ? (
              delivered ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-springgreen600/10 px-2 py-0.5 text-[11px] font-semibold text-springgreen600">
                  <TickCircle size={12} variant="Bold" color="#34A853" />
                  Sent
                </span>
              ) : canResend ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResend();
                  }}
                  disabled={resending}
                  className="inline-flex items-center gap-1 rounded-full border border-gray900 bg-gray900 px-2.5 py-1 text-[11px] font-semibold text-white transition-all active:scale-95"
                >
                  <Refresh2 size={11} variant="Bold" color="#FFFFFF" />
                  {resending ? "Sending…" : "Resend"}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray100 px-2 py-0.5 text-[11px] font-semibold text-gray500">
                  Not sent
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red500/10 px-2 py-0.5 text-[11px] font-semibold text-red500">
                <CloseCircle size={12} variant="Bold" color="#CD432F" />
                Incomplete
              </span>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {student.subjects.map((s) => (
            <ExamScoreChip
              key={s.subjectId}
              subjectName={s.subjectName}
              score={s.examScore}
              maxScore={s.examMaxScore}
            />
          ))}
        </div>

        {student.examMissingSubjects.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-red500/5 px-2 py-0.5 text-[11px] font-medium text-red500">
              <Warning2 size={12} variant="Bold" color="#CD432F" />
              Missing: {student.examMissingSubjects.join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

export const ExamBroadcastSection = ({
  status,
  scope,
}: {
  status: BroadcastStatusResponse;
  scope: BroadcastScope;
}) => {
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmResend, setConfirmResend] = useState(false);
  const navigate = useNavigate();
  const submitMutation = useSubmitExamSheet();
  const resendMutation = useResendExamResults();

  const deliveredSet = useMemo(
    () => new Set(status.examDeliveredStudentIds),
    [status.examDeliveredStudentIds],
  );

  const completeStudents = status.students.filter((s) => s.examComplete);
  const remainingStudents = completeStudents.filter((s) => !deliveredSet.has(s.studentId));
  const completeCount = completeStudents.length;
  const totalCount = status.students.length;
  const pct = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0;

  const examStatus = status.examBroadcast?.status ?? null;

  const hasAnyScores = status.hasExamSessions;
  const canSubmit = hasAnyScores && completeCount > 0;

  const resendTo = (studentIds: string[] | undefined, close: boolean) => {
    resendMutation.mutate(
      { ...scope, studentIds },
      {
        onSuccess: () => {
          if (close) setConfirmResend(false);
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* Status banner */}
      {examStatus === "PENDING" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber500/40 bg-amber500/10 p-4">
          <Clock size={18} variant="Bold" color="#FBBC05" className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber500">Submitted for principal approval</p>
            <p className="text-xs text-gray600 mt-0.5">
              This exam sheet is waiting on the principal — it appears under{" "}
              <span className="font-medium">Exam sheet approval</span> on their pending list. Parents can't see it yet.
            </p>
          </div>
        </div>
      )}

      {examStatus === "APPROVED" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-springgreen600/40 bg-springgreen600/10 p-4">
          <ShieldTick size={18} variant="Bold" color="#34A853" className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-springgreen600">Approved — parents can see these results</p>
            <p className="text-xs text-gray600 mt-0.5">
              Approved {formatTime(status.examBroadcast?.reviewedAt)}. {deliveredSet.size} student
              {deliveredSet.size === 1 ? "" : "s"} already sent · resends below don't need another approval.
            </p>
          </div>
        </div>
      )}

      {examStatus === "REJECTED" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red500/40 bg-red500/10 p-4">
          <CloseCircle size={18} variant="Bold" color="#CD432F" className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red500">Rejected by the principal</p>
            <p className="text-xs text-gray600 mt-0.5">
              {status.examBroadcast?.note
                ? `Note: “${status.examBroadcast.note}”. `
                : ""}
              Review the marks, fix any issues, then submit again.
            </p>
          </div>
        </div>
      )}

      {!hasAnyScores ? (
        <div className="rounded-2xl border border-gray100 bg-white p-8 text-center">
          <Check size={24} className="mx-auto text-gray300 mb-2" variant="Bold" />
          <p className="text-sm font-medium text-gray900">No exam scores yet</p>
          <p className="text-xs text-gray500 mt-1 max-w-xs mx-auto">
            Once terminal exam scores are saved in Mark Scores, the collated exam sheet will appear here for you to
            submit for approval.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="rounded-2xl border border-gray100 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray900">
                  {completeCount} of {totalCount} student{totalCount === 1 ? "" : "s"} have a complete exam sheet
                </p>
                <p className="text-xs text-gray500 mt-0.5">
                  Students with missing subjects still receive what's marked once the sheet is approved.
                </p>
              </div>
              <p className={cn("text-lg font-bold", pct === 100 ? "text-springgreen600" : "text-gray900")}>{pct}%</p>
            </div>
            <div className="mt-3 h-1.5 bg-gray100 rounded-full overflow-hidden">
              <div
                className={cn("h-full bg-gray900 rounded-full transition-all duration-500", pct === 100 && "bg-springgreen600")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="sticky bottom-4 z-10">
            <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-gray100 bg-white/95 backdrop-blur p-3 sm:p-4 shadow-lg shadow-gray900/5">
              <div className="flex-1 min-w-0 text-center sm:text-left">
                {examStatus === "APPROVED" ? (
                  <>
                    <p className="text-sm font-semibold text-gray900">
                      {remainingStudents.length > 0
                        ? `${remainingStudents.length} student${remainingStudents.length === 1 ? "" : "s"} left to send`
                        : "All completed results have been sent"}
                    </p>
                    <p className="text-xs text-gray500 truncate">
                      {remainingStudents.length > 0
                        ? "Send the newly completed exam results to their parents — no new approval needed"
                        : "Resend a specific student's result from their row below"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray900">
                      {examStatus === "PENDING"
                        ? "Awaiting principal approval"
                        : "Ready to submit for approval?"}
                    </p>
                    <p className="text-xs text-gray500 truncate">
                      {examStatus === "PENDING"
                        ? "This exam sheet will go live once the principal approves it"
                        : examStatus === "REJECTED"
                          ? "Fix the marks above, then resubmit this exam sheet"
                          : "Parents see results only after the principal approves"}
                    </p>
                  </>
                )}
              </div>
              {examStatus === "APPROVED" ? (
                <Button
                  onClick={() => setConfirmResend(true)}
                  disabled={remainingStudents.length === 0 || resendMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <Send2 size={16} variant="Bold" color="#FFFFFF" />
                  {resendMutation.isPending
                    ? "Sending…"
                    : `Send to remaining (${remainingStudents.length})`}
                </Button>
              ) : (
                <Button
                  onClick={() => setConfirmSubmit(true)}
                  disabled={!canSubmit || submitMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <Send2 size={16} variant="Bold" color="#FFFFFF" />
                  {submitMutation.isPending
                    ? "Submitting…"
                    : examStatus === "PENDING"
                      ? "Submitted"
                      : examStatus === "REJECTED"
                        ? "Resubmit for approval"
                        : "Submit exam sheet for approval"}
                </Button>
              )}
            </div>
          </div>

          {/* Student list */}
          <StudentListSection
            title="Students"
            meta={`${completeStudents.length} of ${status.students.length} complete`}
          >
            {status.students.map((s) => (
              <ExamStudentRow
                key={s.studentId}
                student={s}
                delivered={deliveredSet.has(s.studentId)}
                canResend={examStatus === "APPROVED"}
                resending={resendMutation.isPending}
                onResend={() => resendTo([s.studentId], false)}
                onOpen={() => navigate(`/teach/ca-and-exams/reports/${s.studentId}?open=report`)}
              />
            ))}
          </StudentListSection>
        </>
      )}

      <BroadcastConfirmModal
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        eyebrow="You are about to submit"
        title="Submit exam sheet for approval?"
        confirmLabel="Submit for approval"
        busy={submitMutation.isPending}
        busyLabel="Submitting…"
        onConfirm={() =>
          submitMutation.mutate(scope, {
            onSuccess: () => setConfirmSubmit(false),
          })
        }
      >
        <div className="space-y-3">
          <BroadcastNote>
            The <span className="font-semibold">{status.className}</span> exam sheet ({completeCount} of {totalCount}{" "}
            students complete) will be sent to the principal. It appears under{" "}
            <span className="font-semibold">Exam sheet approval</span> on their pending list. Parents won't see results
            until it's approved.
          </BroadcastNote>
          <p className="text-sm text-gray500">
            Only subjects with recorded exam scores are included — unmarked subjects don't block the sheet. You can still
            mark missing scores while it's pending; approve-then-resend sends only the newly completed students.
          </p>
        </div>
      </BroadcastConfirmModal>

      <BroadcastConfirmModal
        open={confirmResend}
        onOpenChange={setConfirmResend}
        eyebrow="You are about to broadcast"
        title="Send to remaining students?"
        confirmLabel={`Send to ${remainingStudents.length}`}
        busy={resendMutation.isPending}
        busyLabel="Sending…"
        onConfirm={() => resendTo(undefined, true)}
      >
        <div className="space-y-3">
          <BroadcastNote>
            The <span className="font-semibold">{remainingStudents.length}</span> completed exam result
            {remainingStudents.length === 1 ? "" : "s"} that haven't been sent yet will go to their parents. Students
            already sent are <span className="font-semibold">not</span> re-notified.
          </BroadcastNote>
          <p className="text-sm text-gray500">
            The exam sheet is already approved by the principal, so no further approval is needed.
          </p>
        </div>
      </BroadcastConfirmModal>
    </div>
  );
};