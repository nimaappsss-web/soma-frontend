import { useState, useRef, useEffect } from "react";
import { useForm, useWatch, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/utils/toast";
import { User, Building, ArrowRight, CalendarTick, Card as CardIcon } from "iconsax-react";
import { Link, useSearchParams } from "react-router";

import { useAuth } from "../contexts/AuthContext";
import { useUpdateSchool, useSchoolInfo } from "../features/principal/api";
import { useSchoolSettings } from "../features/settings/api/useSchoolSettings";
import type { ManualBankDetails } from "../features/settings/types";
import { useGenerateAdmission } from "../features/students/api";
import { useChangePassword } from "../features/auth/api";
import { schoolUpdateSchema, type SchoolUpdateFormData } from "../features/principal/utils/validationSchema";
import { uploadFile } from "../utils/upload";
import { addToQueue } from "../sync/syncQueue";
import { transformError } from "../utils/transformError";
import { SCHOOL_TYPES, SCHOOL_TYPE_LABELS, type SchoolType } from "../utils/schoolType";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { SelectDropdown } from "../components/ui/select-dropdown";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Avatar } from "../components/ui/Avatar";
import { SomaLoader } from "../components/ui/SomaLoader";
import { cn } from "../lib/utils";
import { TagInput } from "../components/ui/tag-input";
import { MultiSelect } from "../components/ui/multi-select";
import { Switch } from "../components/ui/switch";
import { DeleteConfirmDialog } from "../components/others/DeleteConfirmDialog";

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
  { id: "payments", label: "Payments", icon: CardIcon },
  { id: "terms", label: "Term Settings", icon: CalendarTick },
] as const;

type Tab = (typeof tabs)[number]["id"];

export const AdminSettings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: Tab =
    tabParam && tabs.some((t) => t.id === tabParam) ? (tabParam as Tab) : "account";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams(tab === "account" ? {} : { tab }, { replace: true });
  };

  return (
    <div className="p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray900">Settings</h1>

      <div className="flex gap-3 mt-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
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
        {activeTab === "payments" && <PaymentsSection />}
        {activeTab === "terms" && <TermSettingsSection />}
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
  const { data: settings } = useSchoolSettings();
  const armsSetting = settings?.find((s) => s.key === "arms");
  const armsEditable = armsSetting?.editable !== false;

  const [arms, setArms] = useState<string[]>([]);
  const savedArms = useRef<string[]>([]);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [pendingSave, setPendingSave] = useState<SchoolUpdateFormData | null>(null);

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
      const types = Array.isArray(raw) ? (raw as SchoolType[]) : [];
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

  const doSave = (data: SchoolUpdateFormData) => {
    updateSchool.mutate(
      {
        name: data.name,
        admissionPattern: data.admissionPattern || undefined,
        state: data.state,
        lga: data.lga,
        schoolType: data.schoolType,
        address: data.address || undefined,
        arms: arms,
      },
      {
        onSuccess: () => {
          savedArms.current = arms;
          reset(data);
          setConfirmReplace(false);
          setPendingSave(null);
        },
      },
    );
  };

  const onSave = (data: SchoolUpdateFormData) => {
    if (isArmsDirty) {
      setPendingSave(data);
      setConfirmReplace(true);
      return;
    }
    doSave(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Details</CardTitle>
        <CardDescription>Edit your school's information</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <SomaLoader label="Loading…" className="h-8 w-8" />
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
                  disabled={!armsEditable}
                  placeholder={armsEditable ? "Type arm and press Enter" : "Arms locked"}
                />
                {armsEditable ? (
                  <p className="text-xs text-gray-400">Each arm becomes a class section (e.g. JSS 1A, JSS 1B).</p>
                ) : (
                  <p className="text-xs text-amber-600">
                    {armsSetting?.editableReason ?? "Cannot be changed after students have been registered."}
                  </p>
                )}
                {!armsEditable && (
                  <Link
                    to="/admin/classes?add=1"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Add arms by creating new classes
                    <ArrowRight size={12} color="#2563EB" />
                  </Link>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>
            <Button
              type="submit"
              disabled={(!isDirty && !isArmsDirty) || updateSchool.isPending}
              className="w-full"
            >
              {updateSchool.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        )}
      </CardContent>
      <DeleteConfirmDialog
        open={confirmReplace}
        onOpenChange={setConfirmReplace}
        title="Replace classes?"
        description="Changing arms will replace the existing standard classes — the current no-arm classes will be replaced with the new arm sections (e.g. JSS 1 → JSS 1A, JSS 1B)."
        confirmInputLabel="Type REPLACE to continue"
        confirmInputPlaceholder="REPLACE"
        confirmInputValue="REPLACE"
        confirmLabel="Replace"
        onConfirm={() => pendingSave && doSave(pendingSave)}
      />
    </Card>
  );
};

const PaymentsSection = () => {
  const updateSchool = useUpdateSchool();
  const { data: settings, isLoading } = useSchoolSettings();
  const bankSetting = settings?.find((s) => s.key === "manualBankDetails");
  const bank = (bankSetting?.value as ManualBankDetails | null) ?? {};
  const editable = bankSetting?.editable !== false;

  const [bankName, setBankName] = useState<string>(bank.bankName ?? "");
  const [accountName, setAccountName] = useState<string>(bank.accountName ?? "");
  const [accountNumber, setAccountNumber] = useState<string>(bank.accountNumber ?? "");

  useEffect(() => {
    setBankName(bank.bankName ?? "");
    setAccountName(bank.accountName ?? "");
    setAccountNumber(bank.accountNumber ?? "");
  }, [bank.bankName, bank.accountName, bank.accountNumber]);

  const dirty =
    bankName !== (bank.bankName ?? "") ||
    accountName !== (bank.accountName ?? "") ||
    accountNumber !== (bank.accountNumber ?? "");

  const onSave = () => {
    updateSchool.mutate(
      {
        manualBankDetails: {
          bankName: bankName.trim() || undefined,
          accountName: accountName.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
        },
      },
      { onSuccess: () => toast.success("Bank details saved!") },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bank Transfer Details</CardTitle>
          <CardDescription>
            The account parents send fees to when they pay by bank transfer. These details appear in
            their payment flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SomaLoader label="Loading…" className="h-8 w-8" />
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank name</Label>
                <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={!editable} placeholder="e.g. First Bank" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account name</Label>
                <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} disabled={!editable} placeholder="e.g. Jerimiah College" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account number</Label>
                <Input id="accountNumber" inputMode="numeric" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} disabled={!editable} placeholder="e.g. 0123456789" />
              </div>
              <Button type="button" onClick={onSave} disabled={!dirty || updateSchool.isPending} className="w-full">
                {updateSchool.isPending ? "Saving..." : "Save Bank Details"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TermSettingsSection = () => {
  const updateSchool = useUpdateSchool();
  const { data: school, isLoading } = useSchoolInfo();
  const enabled = school?.assessmentMode !== "standard";

  const onToggle = (next: boolean) => {
    updateSchool.mutate({ assessmentMode: next ? "thirdTermAverage" : "standard" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Term Settings</CardTitle>
          <CardDescription>Configure how results are computed across the session.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SomaLoader label="Loading…" className="h-8 w-8" />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Third Term Average</p>
                <p className="text-xs text-gray-500 mt-1 max-w-md">
                  When on, the session result averages the First, Second and Third term scores — each
                  subject's total is (First + Second + Third) &divide; 3, where every term is scored out of
                  100 (First Term = CA/40 + Exam/60).
                </p>
                <p
                  className={cn(
                    "text-xs font-medium mt-2",
                    enabled ? "text-green-600" : "text-gray-400",
                  )}
                >
                  {enabled ? "Enabled — third term average mode" : "Standard — single term results"}
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={onToggle}
                disabled={updateSchool.isPending}
                aria-label="Third Term Average"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SCHOOL_TYPE_OPTIONS: Array<{ value: string; label: string }> = SCHOOL_TYPES.map((value) => ({
  value,
  label: SCHOOL_TYPE_LABELS[value],
}));

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
          setValue("schoolType", values as SchoolType[], { shouldDirty: true })
        }
        placeholder="Select school type"
      />
    </div>
  );
};


