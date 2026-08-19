import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft2, TickCircle } from "iconsax-react";

import { useForgotPassword } from "../features/auth/api";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../features/auth/utils/validationSchema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { AuthLayout } from "../layouts/AuthLayout";

export const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const forgotMutation = useForgotPassword();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: initialEmail },
  });

  const handleSubmit = (data: ForgotPasswordFormData) => {
    forgotMutation.mutate(data, {
      onSuccess: () => setSent(true),
    });
  };

  return (
    <AuthLayout>
      <div className="lg:max-w-85.5">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#E9F7EE] flex items-center justify-center mx-auto">
              <TickCircle size={22} color="#34A853" variant="Bold" />
            </div>
            <h1 className="text-2xl font-medium text-gray-900">Check your email</h1>
            <p className="text-sm text-black/50">
              If an account with that email exists, a reset link has been sent.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={() => form.reset({ email: initialEmail })}
            >
              Send another link
            </Button>
            <Link
              to="/login"
              aria-label="Back to login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft2 variant="Linear" size={16} color="#8C8C8C" />
              Back to login
            </Link>
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
              <h1 className="text-2xl font-medium text-gray-900">Reset password</h1>
            </div>
            <p className="text-sm text-black/50 mt-2">
              Enter the email linked to your account and we'll send you a reset link.
            </p>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 mt-6">
              {forgotMutation.isError && (
                <p className="text-sm text-red-500">{forgotMutation.error?.message}</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@school.com"
                  autoComplete="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <Button type="submit" disabled={forgotMutation.isPending} className="w-full">
                {forgotMutation.isPending ? "Sending link..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};