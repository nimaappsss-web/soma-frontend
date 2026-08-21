import { useState } from "react";
import { Add, People } from "iconsax-react";
import { Avatar } from "../../../components/ui/Avatar";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { useParents } from "../api/useParents";
import { useResendParentInvite } from "../api/useResendParentInvite";
import { InviteParentModal } from "./InviteParentModal";
import { ParentDetailModal } from "./ParentDetailModal";
import type { Parent } from "../types";
interface ParentsListSectionProps {
  limit?: number;
  search?: string;
  statusFilter?: "all" | "pending" | "registered";
}
export const ParentsListSection = ({
  limit = 10,
  search = "",
  statusFilter = "all",
}: ParentsListSectionProps) => {
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const { data, isLoading, error } = useParents(page, limit);
  const resendMutation = useResendParentInvite();

  const handleInviteParent = () => {
    setInviteOpen(true);
  };
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Parents</h3>
        <SomaLoader label="Loading parents" className="h-8 w-8" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Parents</h3>
        <p className="text-sm text-red-500">Could not load parents.</p>
      </div>
    );
  }
  const allParents = data?.parents ?? [];
  // Deduplicate by contact: if same email/phone has both "active" and "pending",
  // prefer the "pending" entry (it carries the expiry/retry state).
  const dedupeKey = (p: typeof allParents[0]) => p.email || p.phone || p.id;
  const byKey = new Map<string, typeof allParents[0]>();
  const pendingKeys = new Set(allParents.filter((p) => p.status === "pending").map(dedupeKey));
  for (const p of allParents) {
    const key = dedupeKey(p);
    if (p.status === "pending") {
      byKey.set(key, p);
    } else if (p.status === "active" && !pendingKeys.has(key)) {
      byKey.set(key, p);
    }
  }
  const merged = Array.from(byKey.values());
  const pendingInvites = merged.filter((p) => p.status === "pending");
  const registered = merged.filter((p) => p.status === "active");
  const totalPages = data?.totalPages ?? 1;
  const q = search.trim().toLowerCase();
  const match = (p: typeof allParents[0]) =>
    !q ||
    p.name?.toLowerCase().includes(q) ||
    p.email?.toLowerCase().includes(q) ||
    p.phone?.toLowerCase().includes(q) ||
    (p.students ?? []).some((s) => s.name.toLowerCase().includes(q));
  const filteredPending = pendingInvites.filter(match);
  const filteredRegistered = registered.filter(match);
  const visiblePending = statusFilter === "pending" || statusFilter === "all" ? filteredPending : [];
  const visibleRegistered = statusFilter === "registered" || statusFilter === "all" ? filteredRegistered : [];
  const hasResults = visiblePending.length > 0 || visibleRegistered.length > 0;
  if (merged.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Parents</h3>
        <EmptyState
          className="min-h-[260px]"
          icon={<People size={30} variant="Bold" color="#0D0D0D" />}
          title="Invite your first parent"
          description="Parents follow their children's attendance, scores and reports. Invite one to get started."
          actionLabel="Invite Parent"
          actionIcon={<Add size={16} color="#FFFFFF" variant="Linear" />}
          onAction={handleInviteParent}
        />
      </div>
    );
  }
  const formatExpiry = (seconds: number) => {
    if (seconds < 60) return "Expiring soon";
    const hours = Math.round(seconds / 3600);
    return `${hours}h remaining`;
  };
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {!hasResults && (q || statusFilter !== "all") ? (
        <EmptyState
          className="min-h-[200px]"
          icon={<People size={30} variant="Bold" color="#0D0D0D" />}
          title="No parents found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <>
      {visiblePending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h4 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray900">
              Pending Invites
              <span className="ml-2 text-gray400">{visiblePending.length}</span>
            </h4>
            <span className="h-px flex-1 bg-gray100" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visiblePending.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedParent(inv)}
                className="rounded-2xl border border-gray100 bg-white p-5 transition-shadow hover:shadow-[0_14px_30px_-16px_rgba(0,0,0,0.18)] cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={inv.name || inv.email} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray900">
                        {inv.name || "—"}
                      </p>
                      <p className="truncate text-xs text-gray400">{inv.email || inv.phone || "—"}</p>
                    </div>
                  </div>
                  <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Pending
                  </span>
                </div>

                <div className="mt-4">
                  {(inv.students ?? []).length > 0 && (
                    <p className="text-xs text-gray500">
                      <span className="text-gray400">Linked: </span>
                      {inv.students?.map((s) => s.name).join(", ")}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray50 pt-3">
                  {inv.expiresIn != null && (
                    <span className={`text-xs ${inv.emailFailed ? "text-red-500" : "text-gray400"}`}>
                      {inv.emailFailed ? "Email failed" : formatExpiry(inv.expiresIn)}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); resendMutation.mutate(inv.id); }}
                    disabled={resendMutation.isPending}
                    title={inv.emailError ?? "Resend invite"}
                    className="ml-auto rounded-full px-3 py-1.5 text-xs font-medium text-gray900 transition-colors hover:bg-gray50 disabled:opacity-50"
                  >
                    {resendMutation.isPending ? "..." : "Resend invite"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {visibleRegistered.length > 0 && (
        <div>
          {pendingInvites.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <h4 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray900">
                Registered
                <span className="ml-2 text-gray400">{visibleRegistered.length}</span>
              </h4>
              <span className="h-px flex-1 bg-gray100" />
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visibleRegistered.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedParent(p)}
                className="rounded-2xl border border-gray100 bg-white p-5 transition-shadow hover:shadow-[0_14px_30px_-16px_rgba(0,0,0,0.18)] cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={p.name} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray900">{p.name}</p>
                      <p className="truncate text-xs text-gray400">
                        {p.email}
                        {p.phone ? ` · ${p.phone}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                    Active
                  </span>
                </div>

                <div className="mt-4">
                  {(p.students ?? []).length > 0 && (
                    <p className="text-xs text-gray500">
                      <span className="text-gray400">Children: </span>
                      {p.students?.map((s) => s.name).join(", ")}
                    </p>
                  )}
                </div>

                {!p.hasAccount && (
                  <div className="mt-4 flex items-center justify-between border-t border-gray50 pt-3">
                    <span className="inline-flex items-center rounded-full bg-gray100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray500">
                      No password
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); p.inviteId && resendMutation.mutate(p.inviteId); }}
                      disabled={resendMutation.isPending || !p.inviteId}
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-gray900 transition-colors hover:bg-gray50 disabled:opacity-50"
                    >
                      {resendMutation.isPending ? "..." : "Resend invite"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-default"
          >
            &larr; Prev
          </button>
          <span className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-default"
          >
            Next &rarr;
          </button>
        </div>
      )}
        </>
      )}
      <InviteParentModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ParentDetailModal
        open={selectedParent !== null}
        onClose={() => setSelectedParent(null)}
        parent={selectedParent}
      />
    </div>
  );
};
