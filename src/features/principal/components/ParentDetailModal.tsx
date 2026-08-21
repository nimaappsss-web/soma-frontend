import { Avatar } from "../../../components/ui/Avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import type { Parent } from "../types";

interface ParentDetailModalProps {
  open: boolean;
  onClose: () => void;
  parent: Parent | null;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const ParentDetailModal = ({
  open,
  onClose,
  parent,
}: ParentDetailModalProps) => {
  if (!parent) return null;

  const students = parent.students ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent variant="middle" className="p-0 overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <DialogHeader className="p-0">
            <DialogTitle>Parent Details</DialogTitle>
            <DialogDescription className="sr-only">
              Details for {parent.name}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center gap-4">
            <Avatar name={parent.name} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-gray900">
                {parent.name}
              </p>
              <p className="truncate text-sm text-gray500">
                {parent.email}
                {parent.phone ? ` · ${parent.phone}` : ""}
              </p>
            </div>
            <span
              className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                parent.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {parent.status === "active" ? "Active" : "Pending"}
            </span>
          </div>
        </div>

        {/* Info grid */}
        <div className="border-t border-gray100 px-6 py-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              { label: "Email verified", value: parent.emailVerified ? "Yes" : "No" },
              { label: "Has account", value: parent.hasAccount ? "Yes" : "No" },
              { label: "Joined", value: formatDate(parent.createdAt) },
              { label: "Last updated", value: formatDate(parent.updatedAt) },
              ...(parent.status === "pending"
                ? [
                    { label: "Invited", value: formatDate(parent.invitedAt) },
                    { label: "Expires", value: formatDate(parent.expiresAt) },
                  ]
                : []),
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] uppercase tracking-wide text-gray400 font-medium">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Children */}
        <div className="border-t border-gray100 px-6 py-4">
          <p className="text-[10px] uppercase tracking-wide text-gray400 font-medium mb-3">
            Children ({students.length})
          </p>
          {students.length === 0 ? (
            <p className="text-sm text-gray400 italic">No linked children</p>
          ) : (
            <div className="space-y-2">
              {students.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl bg-gray50 px-4 py-2.5"
                >
                  <Avatar name={s.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray900">
                      {s.name}
                    </p>
                    <p className="truncate text-xs text-gray500">
                      {s.admissionNo}
                      {s.className ? ` · ${s.className}` : ""}
                    </p>
                  </div>
                  {s.teacherName && (
                    <span className="hidden sm:inline-flex shrink-0 text-[10px] text-gray400 font-medium">
                      {s.teacherName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
