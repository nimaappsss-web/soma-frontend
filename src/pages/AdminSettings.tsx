import { useState, useRef, useEffect } from "react";
import { useForm, useWatch, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { User, Building } from "iconsax-react";

import { useAuth } from "../contexts/AuthContext";
import { useUpdateSchool, useSchoolInfo } from "../features/principal/api";
import { useGenerateAdmission } from "../features/students/api";
import { useChangePassword } from "../features/auth/api";
import { schoolUpdateSchema, type SchoolUpdateFormData } from "../features/principal/utils/validationSchema";
import { uploadFile } from "../utils/upload";
import { addToQueue } from "../sync/syncQueue";
import { transformError } from "../utils/transformError";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { SelectDropdown } from "../components/ui/select-dropdown";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Avatar } from "../components/ui/Avatar";
import { cn } from "../lib/utils";
import { TagInput } from "../components/ui/tag-input";
import { MultiSelect } from "../components/ui/multi-select";

const NIGERIAN_STATES = ["Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Kaduna"];

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
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

const tabs = [
  { id: "account", label: "Account", icon: User },
  { id: "school", label: "School", icon: Building },
] as const;

type Tab = (typeof tabs)[number]["id"];

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      <div className="flex gap-3 mt-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600",
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {activeTab === "account" && <AccountSection />}
        {activeTab === "school" && <SchoolSection />}
      </div>
    </div>
  );
};

const AccountSection = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const changePassword = useChangePassword();

  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

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
        onError: (err) => toast.error(transformError(err)),
      },
    );
  };

  const previewUrl = pendingImage ? URL.createObjectURL(pendingImage) : null;
  const imageToShow = previewUrl || user?.image;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar name={user?.name ?? "?"} imageUrl={imageToShow} size={80} className="border-2 border-gray-200" />
            <div>
              <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                {pendingImage || user?.image ? "Change" : "Upload"}
              </Button>
              <Input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPendingImage(file);
              }} className="hidden" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={accountForm.handleSubmit(onSaveAccount)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input {...accountForm.register("name")} />
                {accountForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{accountForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled className="bg-gray-50 text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" {...accountForm.register("phone")} />
              </div>
            </div>
            <Button type="submit" disabled={saving} size="sm">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" {...passwordForm.register("currentPassword")} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" {...passwordForm.register("newPassword")} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input type="password" {...passwordForm.register("confirmPassword")} />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" disabled={changePassword.isPending} size="sm">
              {changePassword.isPending ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const SchoolSection = () => {
  const updateSchool = useUpdateSchool();

  const { data: school, isLoading } = useSchoolInfo();
  const [arms, setArms] = useState<string[]>([]);
  const savedArms = useRef<string[]>([]);

  useEffect(() => {
    if (school) {
      setArms(school.arms ?? []);
      savedArms.current = school.arms ?? [];
    }
  }, [school?.id]);

  const isArmsDirty = arms.length !== savedArms.current.length ||
    arms.some((a, i) => a !== savedArms.current[i]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<SchoolUpdateFormData>({
    resolver: zodResolver(schoolUpdateSchema),
    defaultValues: {
      name: "", admissionPattern: "",
      state: "", lga: "", schoolType: [], address: "",
    },
  });

  useEffect(() => {
    if (school) {
      const year = String(new Date().getFullYear());
      const example = !school.admissionPattern
        ? `ATH/${year}/001`
        : school.admissionPattern === "{year}/{seq}"
          ? `ATH/${year}/001`
          : school.admissionPattern.replace("{year}", year).replace("{seq}", "001");
      const raw = school.schoolType;
      const types = Array.isArray(raw) ? raw as ("secondary" | "creche" | "kg" | "primary")[] : [];
      reset({
        name: school.name,
        admissionPattern: example,
        state: school.state,
        lga: school.lga,
        schoolType: types,
        address: school.address,
      });
    }
  }, [school?.id, reset]);

  const { data: preview } = useGenerateAdmission(true);

  const onSave = (data: SchoolUpdateFormData) => {
    updateSchool.mutate(
      {
        name: data.name,
        admissionPattern: data.admissionPattern || undefined,
        state: data.state,
        lga: data.lga,
        schoolType: data.schoolType,
        address: data.address || undefined,
        arms: arms.length ? arms : undefined,
      },
      {
        onSuccess: () => {
          savedArms.current = arms;
          reset(data);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Details</CardTitle>
        <CardDescription>Edit your school's information</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : !school ? (
          <p className="text-sm text-gray-400">Could not load school data.</p>
        ) : (
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">School Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admissionPattern">Admission Pattern</Label>
              <Input id="admissionPattern" placeholder={`e.g. ATH/${new Date().getFullYear()}/001`} {...register("admissionPattern")} />
              {errors.admissionPattern && <p className="text-sm text-destructive">{errors.admissionPattern.message}</p>}
              <p className="text-xs text-gray-400">
                Type an example of how you want admission numbers to look.{" "}
                Next number: <code className="bg-gray-100 px-1 rounded">{preview?.admissionNo ?? "—"}</code>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Controller
                  control={control}
                  name="state"
                  render={({ field }) => (
                    <SelectDropdown
                      placeholder="Select state"
                      options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lga">LGA</Label>
                <Input id="lga" {...register("lga")} />
                {errors.lga && <p className="text-sm text-destructive">{errors.lga.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SchoolTypeSelect control={control} setValue={setValue} />
              <div className="space-y-2">
                <Label>Arms</Label>
                <TagInput
                  value={arms}
                  onChange={setArms}
                  placeholder="Type arm and press Enter"
                />
                <p className="text-xs text-gray-400">Each arm becomes a class section (e.g. JSS 1A, JSS 1B).</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>
            <Button type="submit" disabled={(!isDirty && !isArmsDirty) || updateSchool.isPending} className="w-full">
              {updateSchool.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

const SCHOOL_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "creche", label: "Creche" },
  { value: "kg", label: "Kindergarten" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
];

const SchoolTypeSelect = ({
  control,
  setValue,
}: {
  control: Control<SchoolUpdateFormData>;
  setValue: ReturnType<typeof useForm<SchoolUpdateFormData>>["setValue"];
}) => {
  const selected = useWatch({ control, name: "schoolType" }) ?? [];

  return (
    <div className="space-y-2">
      <Label>School Type</Label>
      <MultiSelect
        options={SCHOOL_TYPE_OPTIONS}
        selected={selected}
        onChange={(values) =>
          setValue("schoolType", values as ("secondary" | "creche" | "kg" | "primary")[], { shouldDirty: true })
        }
        placeholder="Select school type"
      />
    </div>
  );
};


