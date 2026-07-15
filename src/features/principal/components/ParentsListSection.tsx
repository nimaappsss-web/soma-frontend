import { useState } from "react";

import { Avatar } from "../../../components/ui/Avatar";
import { useParents } from "../api/useParents";
import { useResendParentInvite } from "../api/useResendParentInvite";

interface ParentsListSectionProps {
  limit?: number;
}

export const ParentsListSection = ({ limit = 10 }: ParentsListSectionProps) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useParents(page, limit);
  const resendMutation = useResendParentInvite();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Parents</h3>
        <p className="text-sm text-gray-400">Loading...</p>
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

  // Deduplicate: if same email has both "active" and "pending", prefer the "pending" entry
  const byEmail = new Map<string, typeof allParents[0]>();
  const pendingEmails = new Set(allParents.filter((p) => p.status === "pending").map((p) => p.email));
  for (const p of allParents) {
    if (p.status === "pending") {
      byEmail.set(p.email, p);
    } else if (p.status === "active" && !pendingEmails.has(p.email)) {
      byEmail.set(p.email, p);
    }
  }
  const merged = Array.from(byEmail.values());
  const pendingInvites = merged.filter((p) => p.status === "pending");
  const registered = merged.filter((p) => p.status === "active");
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  if (merged.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Parents</h3>
        <p className="text-sm text-gray-400">No parents yet.</p>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatExpiry = (seconds: number) => {
    if (seconds < 60) return "Expiring soon";
    const hours = Math.round(seconds / 3600);
    return `${hours}h remaining`;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Parents</h3>
        <span className="text-xs text-gray-400">{total} total</span>
      </div>

      {pendingInvites.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Pending Invites</h4>
          <div className="divide-y divide-gray-50">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={inv.name || inv.email} size={32} />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{inv.name || "—"}</p>
                  <p className="text-xs text-gray-400 truncate">{inv.email}</p>
                  {inv.students.length > 0 && (
                    <p className="text-xs text-gray-400 truncate">
                      Linked: {inv.students.map((s) => s.name).join(", ")}
                    </p>
                  )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={() => resendMutation.mutate(inv.id)}
                    disabled={resendMutation.isPending}
                    className={`text-xs underline disabled:opacity-50 ${inv.emailFailed ? "text-red-500 hover:text-red-700" : "text-blue-600 hover:text-blue-700"}`}
                    title={inv.emailError ?? "Resend invite"}
                  >
                    {resendMutation.isPending ? "..." : "Resend"}
                  </button>
                  {inv.expiresIn != null && (
                    <span className="text-xs text-gray-400">{formatExpiry(inv.expiresIn)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {registered.length > 0 && (
        <div>
          {pendingInvites.length > 0 && (
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Registered</h4>
          )}
          <div className="divide-y divide-gray-50">
            {registered.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={p.name} size={32} />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">{p.email}{p.phone ? ` · ${p.phone}` : ""}</p>
                    {p.students.length > 0 && (
                      <p className="text-xs text-gray-400 truncate">
                        Children: {p.students.map((s) => s.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {p.hasAccount ? (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                      No account
                    </span>
                  )}
                </div>
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
    </div>
  );
};
