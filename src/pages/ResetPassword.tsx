import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useResetPassword } from "../features/auth/api";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "../features/auth/utils/validationSchema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const [reset, setReset] = useState(false);

  const resetMutation = useResetPassword();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSubmit = (data: ResetPasswordFormData) => {
    resetMutation.mutate(
      { token, password: data.password },
      {
        onSuccess: () => {
          setReset(true);
          setTimeout(() => navigate("/login"), 2000);
        },
      },
    );
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4 text-center">
          <h1 className="text-xl font-bold text-red-600">Invalid Link</h1>
          <p className="text-sm text-gray-500">This reset link is invalid or expired.</p>
          <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm block">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-700">Soma</h1>
          <p className="text-gray-500 text-sm mt-1">Choose a new password</p>
        </div>

        {reset ? (
          <div className="text-center space-y-4">
            <p className="text-green-600 text-sm">Password reset successfully! Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {resetMutation.isError && (
              <p className="text-sm text-red-500">{resetMutation.error?.message}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" placeholder="At least 6 characters" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Repeat new password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={resetMutation.isPending} className="w-full">
              {resetMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
