import { useState, useRef } from "react";
import { toast } from "@/utils/toast";
import { Profile } from "iconsax-react";
import { SomaLoader, parentLoadingDescriptions } from "../components/ui/SomaLoader";

import { useAuth } from "../contexts/AuthContext";
import { useParentProfile } from "../features/parent/api";
import { Avatar } from "../components/ui/Avatar";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { addToQueue } from "../sync/syncQueue";
import { uploadFile } from "../utils/upload";
import { transformError } from "../utils/transformError";

export const ParentSettings = () => {
  const { user, updateUser } = useAuth();
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
      const payload: Record<string, unknown> = {};
      if (name !== initialName) payload.name = name;
      if (phone !== (parent?.phone ?? "")) payload.phone = phone || null;
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
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(transformError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!user || !pendingImage) return;
    setSaving(true);
    try {
      const imageUrl = await uploadFile(pendingImage);
      await addToQueue({
        userId: user.id,
        table: "users",
        recordId: user.id,
        endpoint: "/auth/me",
        method: "PATCH",
        payload: { image: imageUrl },
      });
      updateUser({ image: imageUrl });
      setPendingImage(null);
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error(transformError(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <SomaLoader descriptions={parentLoadingDescriptions} />
      </div>
    );
  }

  const previewUrl = pendingImage ? URL.createObjectURL(pendingImage) : null;
  const imageToShow = previewUrl ?? parent?.image ?? user?.image;

  return (
    <div className="p-4 md:p-6 w-full">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray900">Settings</h1>
        <p className="text-xs md:text-sm text-gray500 mt-1">Manage your profile and account</p>

        <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-input bg-card p-1">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium bg-gray900 text-white"
          >
            <Profile size={15} color="#FFFFFF" />
            Account
          </button>
        </div>
      </div>

      <div className="space-y-5 mt-5 w-full">
        <Card className="rounded-3xl border-gray100 shadow-none">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-base font-semibold text-gray900">Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex items-center gap-6">
              <Avatar name={name || "?"} imageUrl={imageToShow} size={80} className="border-2 border-gray-200" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                    {pendingImage || parent?.image || user?.image ? "Change" : "Upload"}
                  </Button>
                  {pendingImage && (
                    <Button type="button" onClick={handleSavePhoto} disabled={saving} size="sm">
                      {saving ? "Saving..." : "Save photo"}
                    </Button>
                  )}
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-400">JPG, PNG or GIF. Compressed to max 1MB.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-gray100 shadow-none">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-base font-semibold text-gray900">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={parent?.email ?? ""} disabled className="bg-gray-50 text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};