import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";

import { useAuth } from "../contexts/AuthContext";
import { useUpdateSchool } from "../features/principal/api/useUpdateSchool";
import { useGenerateAdmission } from "../features/students/api";
import { fetchData } from "../utils/fetchData";
import { schoolUpdateSchema, type SchoolUpdateFormData } from "../features/principal/utils/validationSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

const NIGERIAN_STATES = ["Lagos", "Abuja", "Rivers", "Kano", "Oyo", "Kaduna"];

interface SchoolSettings {
  id: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  schoolType: string;
  logo: string | null;
  schoolCode: string | null;
  admissionPattern: string;
  admissionCounter: number;
  arms: string[];
}

export const AdminSettings = () => {
  const { user, logout } = useAuth();
  const updateSchool = useUpdateSchool();

  const { data, isLoading } = useQuery<{ school: SchoolSettings }>({
    queryKey: ["school"],
    queryFn: () => fetchData("/school", "GET"),
  });

  const school = data?.school;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SchoolUpdateFormData>({
    resolver: zodResolver(schoolUpdateSchema),
    defaultValues: {
      name: "", admissionPattern: "",
      state: "", lga: "", schoolType: "", address: "", arms: "",
    },
  });

  useEffect(() => {
    if (school) {
      const year = String(new Date().getFullYear());
      const example = school.admissionPattern === "{year}/{seq}"
        ? `ATH/${year}/001`
        : school.admissionPattern
            .replace("{year}", year)
            .replace("{seq}", "001");

      reset({
        name: school.name,
        admissionPattern: example,
        state: school.state,
        lga: school.lga,
        schoolType: school.schoolType,
        address: school.address,
        arms: school.arms?.join(", ") ?? "",
      });
    }
  }, [school, reset]);

  const { data: preview } = useGenerateAdmission(true);

  const onSave = (data: SchoolUpdateFormData) => {
    updateSchool.mutate({
      name: data.name,
      admissionPattern: data.admissionPattern || undefined,
      state: data.state,
      lga: data.lga,
      schoolType: data.schoolType,
      address: data.address || undefined,
      arms: data.arms
        ? data.arms.split(",").map((a) => a.trim()).filter(Boolean)
        : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-700">Soma</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.schoolName}</span>
          <span className="text-sm text-gray-700">{user?.name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">{user?.role}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">Sign out</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600">&larr; Dashboard</Link>
        <h2 className="text-2xl font-bold text-gray-800 mt-2 mb-6">School Settings</h2>

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
                  <Input
                    id="admissionPattern"
                    placeholder={`e.g. ATH/${new Date().getFullYear()}/001`}
                    {...register("admissionPattern")}
                  />
                  {errors.admissionPattern && <p className="text-sm text-destructive">{errors.admissionPattern.message}</p>}
                  <p className="text-xs text-gray-400">
                    Type an example of how you want admission numbers to look.{" "}
                    Next number: <code className="bg-gray-100 px-1 rounded">{preview?.admissionNo ?? "—"}</code>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <select
                    id="state"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    {...register("state")}
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lga">LGA</Label>
                  <Input id="lga" {...register("lga")} />
                  {errors.lga && <p className="text-sm text-destructive">{errors.lga.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolType">School Type</Label>
                  <select
                    id="schoolType"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    {...register("schoolType")}
                  >
                    <option value="secondary">Secondary</option>
                    <option value="primary">Primary</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arms">
                    Arms <span className="text-gray-400 font-normal">(comma-separated)</span>
                  </Label>
                  <Input
                    id="arms"
                    placeholder="e.g. A, B, C or 1, 2, 3"
                    {...register("arms")}
                  />
                  <p className="text-xs text-gray-400">Each arm becomes a class section (e.g. JSS 1A, JSS 1B).</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...register("address")} />
                </div>

                <Button type="submit" disabled={!isDirty || updateSchool.isPending} className="w-full">
                  {updateSchool.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
