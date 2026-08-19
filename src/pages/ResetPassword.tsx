import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft2, TickCircle, CloseCircle } from "iconsax-react";

import { useResetPassword } from "../features/auth/api";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "../features/auth/utils/validationSchema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AuthLayout } from "../layouts/AuthLayout";

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
      <AuthLayout>
        <div className="lg:max-w-85.5">
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              aria-label="Back to login"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
            >
              <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
            </Link>
            <h1 className="text-2xl font-medium text-gray-900">Invalid link</h1>
          </div>
          <p className="text-sm text-black/50 mt-2">
            This reset link is invalid or expired.
          </p>
          <div className="w-12 h-12 rounded-full bg-red500/10 flex items-center justify-center mx-auto mt-6">
            <CloseCircle size={22} color="#CD432F" variant="Bold" />
          </div>
          <Link
            to="/forgot-password"
            className="mt-4 block text-center text-sm text-gray-500 underline underline-offset-2 hover:text-gray-900"
          >
            Request a new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="lg:max-w-85.5">
        {reset ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#E9F7EE] flex items-center justify-center mx-auto">
              <TickCircle size={22} color="#34A853" variant="Bold" />
            </div>
            <h1 className="text-2xl font-medium text-gray-900">Password updated</h1>
            <p className="text-sm text-black/50">
              Your password has been reset. Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                aria-label="Back to login"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-gray900 active:scale-95"
              >
                <ArrowLeft2 variant="Linear" size={16} color="#FFFFFF" />
              </Link>
              <h1 className="text-2xl font-medium text-gray-900">Choose a new password</h1>
            </div>
            <p className="text-sm text-black/50 mt-2">
              Enter a new password for your account.
            </p>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 mt-6">
              {resetMutation.isError && (
                <p className="text-sm text-red-500">{resetMutation.error?.message}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" disabled={resetMutation.isPending} className="w-full">
                {resetMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};