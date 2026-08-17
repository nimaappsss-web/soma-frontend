import { useState, useRef } from "react";
import { toast } from "@/utils/toast";

import { useAuth } from "../contexts/AuthContext";
import { useParentProfile } from "../features/parent/api";
import { Avatar } from "../components/ui/Avatar";
import { Input } from "../components/ui/input";
import { addToQueue } from "../sync/syncQueue";
import { uploadFile } from "../utils/upload";
import { transformError } from "../utils/transformError";

export const ParentSettings = () => {
  const { user } = useAuth();
  const { parent, isLoading } = useParentProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const initialName = parent?.name ?? user?.name ?? "";
  if (name === "" && initialName !== "") setName(initialName);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImage(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let imageUrl: string | null | undefined;
      if (pendingImage) {
        imageUrl = await uploadFile(pendingImage);
      }
      const payload: Record<string, unknown> = {};
      if (name !== initialName) payload.name = name;
      if (phone !== (parent?.phone ?? "")) payload.phone = phone || null;
      if (imageUrl) payload.image = imageUrl;
      if (Object.keys(payload).length === 0) {
        toast.success("Nothing to update");
        return;
      }
      await addToQueue({
        userId: user.id,
        table: "users",
        recordId: user.id,
        endpoint: "/auth/me",
        method: "PATCH",
        payload,
      });
      setPendingImage(null);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(transformError(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-gray400 p-8">Loading...</p>;
  }

  return (
    <div className="w-full px-6 py-8 max-w-2xl">
      <h2 className="text-xl md:text-2xl font-bold text-gray900 mb-5">Settings</h2>
      <div className="space-y-6">
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray100">
          <h3 className="font-semibold text-gray800 mb-4">Profile Picture</h3>
          <div className="flex items-center gap-6">
            <Avatar name={name || "?"} size={80} className="border-2 border-gray200" />
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray900 text-white rounded-full text-sm font-medium hover:bg-gray700"
              >
                {pendingImage ? "Change" : "Upload"}
              </button>
              {pendingImage && (
                <button
                  onClick={() => setPendingImage(null)}
                  className="ml-2 px-4 py-2 text-red-500 text-sm hover:text-red-600"
                >
                  Remove
                </button>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-xs text-gray400 mt-2">JPG, PNG or GIF. 5MB max.</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray100">
          <h3 className="font-semibold text-gray800 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray500 mb-1">Full Name</label>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray500 mb-1">Email</label>
              <Input
                type="email"
                value={parent?.email ?? ""}
                disabled
                className="bg-gray50 text-gray400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray500 mb-1">Phone</label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-gray900 text-white rounded-full font-medium text-sm hover:bg-gray700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};