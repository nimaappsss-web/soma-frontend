import { useState, useRef } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";

import { useAuth } from "../../contexts/AuthContext";
import { useTeacherDetail } from "../../features/teacher/api";
import { Avatar } from "../../components/ui/Avatar";
import { db } from "../../db/db";
import { addToQueue } from "../../sync/syncQueue";
import { uploadFile } from "../../utils/upload";
import { transformError } from "../../utils/transformError";

export const TeacherSettings = () => {
  const { user, logout } = useAuth();
  const { data: teacher, isLoading } = useTeacherDetail(user!.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
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
      if (finalPictureUrl !== (teacher.profilePictureUrl ?? null))
        payload.profilePictureUrl = finalPictureUrl;

      if (Object.keys(payload).length === 0) {
        toast.success("Nothing to update");
        return;
      }

      const existing = await db.teacherDetails.get(teacher.id);
      if (existing?.detailJson) {
        const merged = { ...JSON.parse(existing.detailJson), ...payload };
        await db.teacherDetails.put({ id: teacher.id, detailJson: JSON.stringify(merged) });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.schoolName}</span>
          <span className="text-sm text-gray-700">{user?.name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
            {user?.role}
          </span>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/teach" className="text-sm text-gray-400 hover:text-gray-600">
              &larr; Dashboard
            </Link>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">Settings</h2>
          </div>
        </div>

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
                <input
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
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={teacher?.email ?? ""}
                  disabled
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm bg-gray-50 text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "M" | "F" | "")}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                >
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role</label>
                <input
                  type="text"
                  value={teacher?.role ?? ""}
                  disabled
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm bg-gray-50 text-gray-400 capitalize"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Form Class</label>
                <input
                  type="text"
                  value={formClassName}
                  disabled
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm bg-gray-50 text-gray-400"
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
      </main>
    </div>
  );
};
