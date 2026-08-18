import { useState, useRef } from "react";
import { toast } from "@/utils/toast";
import { useAuth } from "../../contexts/AuthContext";
import { useTeacherDetail } from "../../features/teacher/api";
import { SomaLoader } from "../../components/ui/SomaLoader";
import { Avatar } from "../../components/ui/Avatar";
import { Input } from "../../components/ui/input";
import { DateInput } from "../../components/ui/date-input";
import { SelectDropdown } from "../../components/ui/select-dropdown";
import { Textarea } from "../../components/ui/textarea";
import { db } from "../../db/db";
import { addToQueue } from "../../sync/syncQueue";
import { uploadFile } from "../../utils/upload";
import { transformError } from "../../utils/transformError";
export const TeacherSettings = () => {
  const { user } = useAuth();
  const { data: teacher, isLoading } = useTeacherDetail(user!.id);
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
  if (!formReady && teacher) {
    setName(teacher.name ?? "");
    setPhone(teacher.phone ?? "");
    setAddress(teacher.address ?? "");
    setGender(teacher.gender ?? "");
    setDateOfBirth(teacher.dateOfBirth ?? "");
    setEmploymentDate(teacher.employmentDate ?? "");
    setProfilePictureUrl(teacher.profilePictureUrl ?? null);
    setFormReady(true);
  }
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImage(file);
    setProfilePictureUrl(URL.createObjectURL(file));
  };
  const handleSave = async () => {
    if (!teacher) return;
    setSaving(true);
    try {
      let finalPictureUrl = profilePictureUrl;
      if (pendingImage) {
        finalPictureUrl = await uploadFile(pendingImage);
      }
      const payload: Record<string, unknown> = {};
      if (name !== teacher.name) payload.name = name;
      if (phone !== (teacher.phone ?? "")) payload.phone = phone || null;
      if (address !== (teacher.address ?? "")) payload.address = address || null;
      if ((gender || null) !== (teacher.gender ?? null)) payload.gender = gender || null;
      if (dateOfBirth !== (teacher.dateOfBirth ?? "")) payload.dateOfBirth = dateOfBirth || null;
      if (employmentDate !== (teacher.employmentDate ?? "")) payload.employmentDate = employmentDate || null;
      if (finalPictureUrl !== (teacher.profilePictureUrl ?? null))
        payload.profilePictureUrl = finalPictureUrl;
      if (Object.keys(payload).length === 0) {
        toast.success("Nothing to update");
        return;
      }
      const existing = await db.teacherDetails.where({ id: teacher.id, userId: user!.id }).first();
      if (existing?.detailJson) {
        const merged = { ...JSON.parse(existing.detailJson), ...payload };
        await db.teacherDetails.put({ id: teacher.id, userId: user!.id, detailJson: JSON.stringify(merged) });
      }
      await addToQueue({
        userId: user!.id,
        table: "teachers",
        recordId: teacher.id,
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
  const formClassName = teacher?.formClass
    ? typeof teacher.formClass === "object"
      ? teacher.formClass.name
      : teacher.formClass
    : "None";
  if (isLoading) {
    return (
      <div className="p-8">
        <SomaLoader label="Loading settings" className="h-8 w-8" />
      </div>
    );
  }
  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-xl md:text-2xl font-bold text-gray900 mb-5">Settings</h2>
      <div className="space-y-6">
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Profile Picture</h3>
          <div className="flex items-center gap-6">
            <Avatar
              name={teacher?.name ?? user?.name ?? "?"}
              imageUrl={profilePictureUrl}
              size={80}
              className="border-2 border-gray-200"
            />
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                {profilePictureUrl ? "Change" : "Upload"}
              </button>
              {profilePictureUrl && (
                <button
                  onClick={() => setProfilePictureUrl(null)}
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
              <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF. 5MB max.</p>
            </div>
          </div>
        </section>
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <Input
                  type="email"
                  value={teacher?.email ?? ""}
                  disabled
                  className="bg-gray-50 text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Gender</label>
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
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
                <DateInput value={dateOfBirth} onChange={setDateOfBirth} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Employment Date</label>
                <DateInput value={employmentDate} onChange={setEmploymentDate} />
              </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Address</label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </section>
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <Input
                type="text"
                value={teacher?.role ?? ""}
                disabled
                className="bg-gray-50 text-gray-400 capitalize"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Form Class</label>
              <Input
                type="text"
                value={formClassName}
                disabled
                className="bg-gray-50 text-gray-400"
              />
            </div>
          </div>
        </section>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};
