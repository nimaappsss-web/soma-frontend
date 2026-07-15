import { useState, useRef, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Avatar } from "../components/ui/Avatar";
import { useAuth } from "../contexts/AuthContext";
import { useMe, useChangePassword } from "../features/auth/api";
import { SchoolSettingsContent } from "../features/settings";
import { uploadFile } from "../utils/upload";
import { addToQueue } from "../sync/syncQueue";
import { transformError } from "../utils/transformError";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(["M", "F", ""]).optional(),
  dateOfBirth: z.string().optional(),
});

type AccountForm = z.infer<typeof accountSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;



export const Settings = () => {
  const { user, logout } = useAuth();
  const { data: profile } = useMe();
  const changePassword = useChangePassword();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      address: "",
      gender: "",
      dateOfBirth: "",
    },
  });

  useEffect(() => {
    if (profile) {
      accountForm.reset({
        name: profile.name ?? user?.name ?? "",
        phone: profile.phone ?? user?.phone ?? "",
        address: "",
        gender: "",
        dateOfBirth: "",
      });
    }
  }, [profile, user, accountForm]);

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImage(file);
  };

  const onSaveAccount = async (data: AccountForm) => {
    if (!user) return;
    setSaving(true);
    try {
      let imageUrl: string | null | undefined;

      if (pendingImage) {
        imageUrl = await uploadFile(pendingImage);
      }

      const payload: Record<string, unknown> = {};
      if (data.name !== user.name) payload.name = data.name;
      if (data.phone !== (user.phone ?? "")) payload.phone = data.phone || null;
      if (data.address) payload.address = data.address;
      if (data.gender) payload.gender = data.gender;
      if (data.dateOfBirth) payload.dateOfBirth = data.dateOfBirth;
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

  const onChangePassword = (data: PasswordForm) => {
    changePassword.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success("Password changed!");
          passwordForm.reset();
        },
        onError: (err) => {
          toast.error(transformError(err));
        },
      },
    );
  };

  const { tab } = useParams<{ tab: string }>();
  const isAdmin = ["principal", "admin"].includes(user?.role?.toLowerCase() ?? "");
  const sidebarItems = isAdmin
    ? [{ id: "account", label: "Account Settings" }, { id: "school", label: "School" }]
    : [{ id: "account", label: "Account Settings" }];

  if (!tab || !["account", "school"].includes(tab)) {
    return <Navigate to="/settings/account" replace />;
  }
  if (tab === "school" && !isAdmin) {
    return <Navigate to="/settings/account" replace />;
  }

  const previewUrl = pendingImage ? URL.createObjectURL(pendingImage) : null;
  const imageToShow = pendingImage ? previewUrl : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.schoolName}</span>
          <Avatar name={user?.name ?? ""} size={24} className="inline-block align-middle" />
          <span className="text-sm text-gray-700">{user?.name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
            {user?.role}
          </span>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
              &larr; Dashboard
            </Link>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">Settings</h2>
          </div>
        </div>

        <div className="flex gap-8">
          <nav className="w-56 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {sidebarItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/settings/${item.id}`}
                  className={`block w-full px-5 py-3 text-left text-sm font-medium transition-colors ${
                    tab === item.id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="flex-1 min-w-0">
            {tab === "account" && (
            <div className="space-y-6">
                <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4">Profile Picture</h3>
                  <div className="flex items-center gap-6">
                    <Avatar
                      name={user?.name ?? "?"}
                      imageUrl={imageToShow ?? profile?.image ?? user?.image}
                      size={80}
                      className="border-2 border-gray-200"
                    />
                    <div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        {pendingImage || profile?.image || user?.image ? "Change" : "Upload"}
                      </button>
                      {(pendingImage || profile?.image || user?.image) && (
                        <button
                          onClick={() => {
                            setPendingImage(null);
                          }}
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
                  <form onSubmit={accountForm.handleSubmit(onSaveAccount)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                        <input
                          type="text"
                          {...accountForm.register("name")}
                          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                        />
                        {accountForm.formState.errors.name && (
                          <p className="text-xs text-red-500 mt-1">{accountForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={user?.email ?? ""}
                          disabled
                          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm bg-gray-50 text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Phone</label>
                        <input
                          type="tel"
                          {...accountForm.register("phone")}
                          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Gender</label>
                        <select
                          {...accountForm.register("gender")}
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
                          {...accountForm.register("dateOfBirth")}
                          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Address</label>
                        <textarea
                          {...accountForm.register("address")}
                          rows={2}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                </section>

                <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
                  <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Current Password</label>
                        <input
                          type="password"
                          {...passwordForm.register("currentPassword")}
                          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                        />
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">New Password</label>
                        <input
                          type="password"
                          {...passwordForm.register("newPassword")}
                          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                        />
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          {...passwordForm.register("confirmPassword")}
                          className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                        />
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={changePassword.isPending}
                      className="px-6 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
                    >
                      {changePassword.isPending ? "Changing..." : "Change Password"}
                    </button>
                  </form>
                </section>
              </div>
            )}

            {tab === "school" && isAdmin && (
              <SchoolSettingsContent />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
