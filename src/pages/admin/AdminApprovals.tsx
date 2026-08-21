import { useState } from "react";
import { ShieldTick, DocumentText, Clock, Check, Profile2User, Book, StatusUp, MessageText } from "iconsax-react";
import { cn } from "@/lib/utils";
import { SomaLoader } from "../../components/ui/SomaLoader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/button";
import { HelpHint } from "../../components/ui/HelpHint";
import {
  useExamBroadcasts,
  useReviewExamBroadcast,
} from "../../features/principal/api";
import type { ExamBroadcast } from "../../features/principal/api/useExamBroadcasts";
import {
  useExamSheetBroadcasts,
  useReviewExamSheet,
} from "../../features/broadcast/api/useExamSheetBroadcasts";
import type { ExamSheetBroadcast } from "../../features/broadcast/types";

type TabId = "exam-results" | "exam-sheet" | "lesson-notes";
type StatusFilter = "PENDING" | "APPROVED" | "REJECTED";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_STYLE: Record<string, { dot: string; text: string; bg: string; active: string }> = {
  PENDING: { dot: "bg-amber500", text: "text-amber500", bg: "bg-amber500/10", active: "bg-amber500/10 border-amber500/40" },
  APPROVED: { dot: "bg-springgreen600", text: "text-springgreen600", bg: "bg-springgreen600/10", active: "bg-springgreen600/10 border-springgreen600/40" },
  REJECTED: { dot: "bg-red500", text: "text-red500", bg: "bg-red500/10", active: "bg-red500/10 border-red500/40" },
};

const TABS: { id: TabId; label: string; Icon: typeof DocumentText }[] = [
  { id: "exam-results", label: "Exam results", Icon: StatusUp },
  { id: "exam-sheet", label: "Exam sheet", Icon: Book },
  { id: "lesson-notes", label: "Lesson notes", Icon: MessageText },
];

const formatRelativeDate = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

const BroadcastCard = ({ item }: { item: ExamBroadcast }) => {
  const { approve, reject } = useReviewExamBroadcast();
  const isPending = item.status === "PENDING";
  const style = STATUS_STYLE[item.status];

  return (
    <div className="rounded-2xl border border-gray100 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray100">
          <Book size={18} variant="Bold" color="#0D0D0D" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray900 truncate">{item.exam.subject.name}</p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none",
                style.bg,
                style.text,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
              {STATUS_LABEL[item.status]}
            </span>
          </div>
          <p className="text-xs text-gray500 mt-1">
            {item.exam.component?.name ?? item.exam.name} · {item.exam.class?.name ?? "All classes"} ·{" "}
            {item.exam.scoreCount} student{item.exam.scoreCount === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-gray400 mt-1">
            Term {item.exam.term} · {item.exam.session}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray500">
        <span className="flex items-center gap-1.5">
          <Profile2User size={14} color="#8C8C8C" />
          {item.teacher?.name ?? "Teacher"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} color="#8C8C8C" />
          {formatRelativeDate(item.createdAt)}
        </span>
        {!isPending && item.reviewedBy && (
          <span className="flex items-center gap-1.5">
            <Check size={14} color="#8C8C8C" />
            {item.status === "APPROVED" ? "Approved" : "Rejected"} by {item.reviewedBy.name}
          </span>
        )}
      </div>

      {item.note && <p className="text-xs text-gray600 mt-2 italic">“{item.note}”</p>}

      {isPending && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => approve.mutate(item.id)}
            disabled={approve.isPending || reject.isPending}
            className="flex-1 sm:flex-none"
          >
            {approve.isPending ? "Approving…" : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => reject.mutate(item.id)}
            disabled={approve.isPending || reject.isPending}
            className="flex-1 sm:flex-none text-red500 border-red500/40 hover:bg-red500/5"
          >
            {reject.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </div>
      )}
    </div>
  );
};

const ExamSheetCard = ({ item }: { item: ExamSheetBroadcast }) => {
  const { approve, reject } = useReviewExamSheet();
  const isPending = item.status === "PENDING";
  const style = STATUS_STYLE[item.status];

  return (
    <div className="rounded-2xl border border-gray100 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray100">
          <Book size={18} variant="Bold" color="#0D0D0D" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray900 truncate">
              {item.class.name} — Exam sheet
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none",
                style.bg,
                style.text,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
              {STATUS_LABEL[item.status]}
            </span>
          </div>
          <p className="text-xs text-gray500 mt-1">
            Term {item.term} · {item.session} · {item.examCount} subject{item.examCount === 1 ? "" : "s"} ·{" "}
            {item.scoreCount} score{item.scoreCount === 1 ? "" : "s"} across {item.studentCount} student
            {item.studentCount === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-gray400 mt-1">
            Whole-class terminal exam broadcast · parents see results once approved
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray500">
        <span className="flex items-center gap-1.5">
          <Profile2User size={14} color="#8C8C8C" />
          {item.teacher?.name ?? "Teacher"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} color="#8C8C8C" />
          {formatRelativeDate(item.createdAt)}
        </span>
        {!isPending && item.reviewedBy && (
          <span className="flex items-center gap-1.5">
            <Check size={14} color="#8C8C8C" />
            {item.status === "APPROVED" ? "Approved" : "Rejected"} by {item.reviewedBy.name}
          </span>
        )}
      </div>

      {item.note && <p className="text-xs text-gray600 mt-2 italic">“{item.note}”</p>}

      {isPending && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => approve.mutate(item.id)}
            disabled={approve.isPending || reject.isPending}
            className="flex-1 sm:flex-none"
          >
            {approve.isPending ? "Approving…" : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => reject.mutate(item.id)}
            disabled={approve.isPending || reject.isPending}
            className="flex-1 sm:flex-none text-red500 border-red500/40 hover:bg-red500/5"
          >
            {reject.isPending ? "Rejecting…" : "Reject"}
          </Button>
        </div>
      )}
    </div>
  );
};

export const AdminApprovals = () => {
  const [tab, setTab] = useState<TabId>("exam-results");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");

  const examBroadcasts = useExamBroadcasts(
    tab === "exam-results" ? statusFilter : undefined,
  );
  const sheetBroadcasts = useExamSheetBroadcasts(
    tab === "exam-sheet" ? statusFilter : undefined,
  );

  const isLoading = tab === "exam-results" ? examBroadcasts.isLoading : sheetBroadcasts.isLoading;
  const items = tab === "exam-results"
    ? (examBroadcasts.data?.requests ?? [])
    : (sheetBroadcasts.data?.requests ?? []);

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Approvals</h1>
          <HelpHint
            title="Approvals"
            storageKey="approvals"
            description="Review teacher submissions before they reach parents."
            sections={[
              {
                title: "Exam results",
                text: "Teachers submit terminal exam results per subject here for your review. Approve to release them to parents; reject to keep them hidden.",
              },
              {
                title: "Exam sheet",
                text: "Form teachers submit a whole class's exam sheet as one request. Approving releases every subject's exam result to parents and notifies each child's parent.",
              },
              { title: "Lesson notes", text: "Coming soon — lesson notes will be reviewable here too." },
            ]}
          />
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-input bg-card p-1 overflow-x-auto no-scrollbar max-w-full">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                  active ? "bg-gray900 text-white" : "text-gray500 hover:text-gray900",
                )}
              >
                <Icon size={15} color={active ? "#FFFFFF" : "#8C8C8C"} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {(tab === "exam-results" || tab === "exam-sheet") && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {(["PENDING", "APPROVED", "REJECTED"] as StatusFilter[]).map((s) => {
            const style = STATUS_STYLE[s];
            const active = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active ? cn(style.bg, style.text, style.active) : "border-gray100 bg-white text-gray700 hover:text-gray900",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                {STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="py-12">
          <SomaLoader label="Loading approvals" />
        </div>
      ) : tab === "lesson-notes" ? (
        <EmptyState
          icon={<DocumentText size={30} variant="Bold" color="#8C8C8C" />}
          title="Lesson note approvals coming soon"
          description="Lesson notes will appear here for review once the feature is enabled."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShieldTick size={30} variant="Bold" color="#8C8C8C" />}
          title={`No ${STATUS_LABEL[statusFilter].toLowerCase()} ${tab === "exam-sheet" ? "exam sheet approvals" : "exam broadcasts"}`}
          description={
            statusFilter === "PENDING"
              ? tab === "exam-sheet"
                ? "When form teachers submit a class's exam sheet for approval, it'll show up here."
                : "When teachers submit terminal exam results for approval, they'll show up here."
              : `Broadcasts you ${statusFilter === "APPROVED" ? "approve" : "reject"} will appear here.`
          }
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) =>
            tab === "exam-sheet" ? (
              <ExamSheetCard key={item.id} item={item as unknown as ExamSheetBroadcast} />
            ) : (
              <BroadcastCard key={item.id} item={item as ExamBroadcast} />
            ),
          )}
        </div>
      )}
    </div>
  );
};