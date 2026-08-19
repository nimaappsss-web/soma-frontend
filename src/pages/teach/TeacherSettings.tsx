import { useState, useRef } from "react";
import { toast } from "@/utils/toast";
import { Profile } from "iconsax-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTeacherDetail } from "../../features/teacher/api";
import { Avatar } from "../../components/ui/Avatar";
import { Input } from "../../components/ui/input";
import { DateInput } from "../../components/ui/date-input";
import { SelectDropdown } from "../../components/ui/select-dropdown";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { db } from "../../db/db";
import { addToQueue } from "../../sync/syncQueue";
import { uploadFile } from "../../utils/upload";
import { transformError } from "../../utils/transformError";

export const TeacherSettings = () => {
  const { user, updateUser } = useAuth();
  const { data: teacherDetail } = useTeacherDetail(user?.id ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [employmentDate, setEmploymentDate] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formReady, setFormReady] = useState(false);

  // Offline-first prefill: the teacher's own profile lives in the user context
  // (persisted in userStorage + refreshed via /auth/me), so the form can render
  // immediately without waiting on the admin-only /teachers/:id fetch.
  if (!formReady && user) {
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setAddress(user.address ?? "");
    setGender(user.gender ?? "");
    setDateOfBirth(user.dateOfBirth ?? "");
    setEmploymentDate(user.employmentDate ?? "");
    setProfilePictureUrl(user.image ?? null);
    setFormReady(true);
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImage(file);
    setProfilePictureUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (name !== (user.name ?? "")) payload.name = name;
      if (phone !== (user.phone ?? "")) payload.phone = phone || null;
      if (address !== (user.address ?? "")) payload.address = address || null;
      if ((gender || null) !== (user.gender ?? null)) payload.gender = gender || null;
      if (dateOfBirth !== (user.dateOfBirth ?? "")) payload.dateOfBirth = dateOfBirth || null;
      if (employmentDate !== (user.employmentDate ?? "")) payload.employmentDate = employmentDate || null;
      if (Object.keys(payload).length === 0) {
        toast.success("Nothing to update");
        return;
      }

      if (teacherDetail) {
        const existing = await db.teacherDetails.where({ id: teacherDetail.id, userId: user.id }).first();
        if (existing?.detailJson) {
          const merged = { ...JSON.parse(existing.detailJson), ...payload };
          await db.teacherDetails.put({ id: teacherDetail.id, userId: user.id, detailJson: JSON.stringify(merged) });
        }
      }

      await addToQueue({
        userId: user.id,
        table: "teachers",
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
        table: "teachers",
        recordId: user.id,
        endpoint: "/auth/me",
        method: "PATCH",
        payload: { image: imageUrl },
      });
      updateUser({ image: imageUrl });
      setProfilePictureUrl(imageUrl);
      setPendingImage(null);
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error(transformError(err));
    } finally {
      setSaving(false);
    }
  };

  const formClassName = user?.formClass
    ? typeof user.formClass === "object"
      ? (user.formClass as { name: string }).name
      : user.formClass
    : teacherDetail?.formClass && typeof teacherDetail.formClass === "object"
      ? teacherDetail.formClass.name
      : typeof teacherDetail?.formClass === "string"
        ? teacherDetail.formClass
        : "None";

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
              <Avatar
                name={user?.name ?? "?"}
                imageUrl={profilePictureUrl}
                size={80}
                className="border-2 border-gray-200"
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                    {profilePictureUrl ? "Change" : "Upload"}
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
                <Input type="email" value={user?.email ?? ""} disabled className="bg-gray-50 text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <SelectDropdown
                  options={[
                    { value: "", label: "Select" },
                    { value: "M", label: "Male" },
                    { value: "F", label: "Female" },
                  ]}
                  value={gender}
                  onChange={(v) => setGender(v as "M" | "F" | "")}
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <DateInput value={dateOfBirth} onChange={setDateOfBirth} />
              </div>
              <div className="space-y-2">
                <Label>Employment Date</Label>
                <DateInput value={employmentDate} onChange={setEmploymentDate} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Address</Label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-gray100 shadow-none">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-base font-semibold text-gray900">Account</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Input type="text" value={user?.role ?? ""} disabled className="bg-gray-50 text-gray-400 capitalize" />
              </div>
              <div className="space-y-2">
                <Label>Form Class</Label>
                <Input type="text" value={formClassName} disabled className="bg-gray-50 text-gray-400" />
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