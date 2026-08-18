import { useState } from "react";
import { Add, Speaker } from "iconsax-react";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { Textarea } from "../../../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { HelpHint } from "../../../components/ui/HelpHint";
import { SomaLoader } from "../../../components/ui/SomaLoader";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from "../api";
import type { CreateAnnouncementPayload, AnnouncementAudience, AnnouncementPriority } from "../types";

const audienceOptions = [
  { value: "ALL_STAFF", label: "All Staff" },
  { value: "TEACHING_ONLY", label: "Teaching Staff Only" },
  { value: "NON_TEACHING_ONLY", label: "Non-Teaching Staff Only" },
  { value: "ALL_PARENTS", label: "All Parents" },
  { value: "ALL_USERS", label: "All Users (School)" },
] as const;

const priorityOptions = [
  { value: "NORMAL", label: "Normal" },
  { value: "IMPORTANT", label: "Important" },
  { value: "URGENT", label: "Urgent" },
] as const;

const emptyPayload: CreateAnnouncementPayload = { title: "", message: "", audience: "" as AnnouncementAudience, priority: "NORMAL" };

export const AnnouncementsManagement = () => {
  const { data, isLoading } = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateAnnouncementPayload>(emptyPayload);

  const announcements = data?.announcements ?? [];

  const handleCreate = () => {
    if (!form.title || !form.message || !form.audience) return;
    createMutation.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm(emptyPayload);
      },
    });
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="group flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-gray900">Announcements</h1>
            <HelpHint
              title="Announcements"
              storageKey="announcements-management"
              description="Broadcast messages to staff, parents, and everyone at your school."
              sections={[
                { title: "Create one", text: "Tap “New Announcement”, add a title and message, choose the audience, then publish." },
                { title: "Audiences", text: "Send to all staff, teaching staff only, non-teaching staff, all parents, or everyone." },
                { title: "Priority", text: "Mark a message as normal, important, or urgent so readers know how to react." },
                { title: "Manage", text: "Published announcements appear in the list below — delete any that are no longer needed." },
              ]}
            />
          </div>
          <p className="text-sm text-gray-400 mt-1">Broadcast messages to staff, parents, and everyone at your school</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} variant="outline" size="sm">
          New Announcement
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setForm(emptyPayload);
        }}
      >
        <DialogContent variant="center" className="md:max-w-xl">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>
              Share an update with staff and parents.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-4">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. End of Term Exams Schedule"
            />
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write your announcement..."
              rows={5}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectDropdown
                options={audienceOptions.map((o) => ({ value: o.value, label: o.label }))}
                value={form.audience}
                onChange={(v) => setForm({ ...form, audience: v as AnnouncementAudience })}
                placeholder="Audience"
              />
              <SelectDropdown
                options={priorityOptions.map((o) => ({ value: o.value, label: o.label }))}
                value={form.priority}
                onChange={(v) => setForm({ ...form, priority: v as AnnouncementPriority })}
                placeholder="Priority"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="py-12">
          <SomaLoader label="Loading announcements" className="h-8 w-8" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{a.title}</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${a.priority === "URGENT" ? "bg-red-100 text-red-700" : a.priority === "IMPORTANT" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                    {a.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.message}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{a.createdBy.name}</span>
                  <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  <span>{audienceOptions.find((o) => o.value === a.audience)?.label ?? a.audience}</span>
                </div>
              </div>
              <Button onClick={() => deleteMutation.mutate(a.id)} variant="ghost" size="sm">Delete</Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Speaker size={30} variant="Bold" color="#0D0D0D" />}
          title="No announcements yet"
          description="Share updates with staff and parents. Create your first announcement to get started."
          actionLabel="New Announcement"
          actionIcon={<Add size={16} color="#FFFFFF" variant="Linear" />}
          onAction={() => setDialogOpen(true)}
        />
      )}
    </div>
  );
};
