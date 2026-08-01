import { useState } from "react";
import { Speaker } from "iconsax-react";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { SelectDropdown } from "../../../components/ui/select-dropdown";
import { Textarea } from "../../../components/ui/textarea";
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

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAnnouncementPayload>(emptyPayload);

  const announcements = data?.announcements ?? [];

  const handleCreate = () => {
    if (!form.title || !form.message || !form.audience) return;
    createMutation.mutate(form, { onSuccess: () => { setShowForm(false); setForm(emptyPayload); } });
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-400 mt-1">Broadcast messages to staff, parents, and everyone at your school</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm">
          {showForm ? "Cancel" : "New Announcement"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-4">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. End of Term Exams Schedule"
          />
          <Textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Write your announcement..."
            rows={4}
          />
          <div className="grid grid-cols-2 gap-4">
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
          <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-12">Loading...</p>
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
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-6 text-center">
            <Speaker size={32} className="mx-auto text-gray-200 mb-3" variant="Bold" />
            <p className="text-sm text-gray-400">No announcements yet</p>
            <p className="text-xs text-gray-300 mt-1">Create your first announcement to get started</p>
          </div>
        </div>
      )}
    </div>
  );
};
