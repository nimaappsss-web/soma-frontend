import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForgotPassword } from "../features/auth/api";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../features/auth/utils/validationSchema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export const ForgotPassword = () => {
  const [sent, setSent] = useState(false);

  const forgotMutation = useForgotPassword();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = (data: ForgotPasswordFormData) => {
    forgotMutation.mutate(data, {
      onSuccess: () => setSent(true),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-700">Soma</h1>
          <p className="text-gray-500 text-sm mt-1">Reset your password</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-green-600 text-sm">
              If an account with that email exists, a reset link has been sent.
            </p>
            <Link to="/login" className="text-blue-600 hover:underline text-sm block">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {forgotMutation.isError && (
              <p className="text-sm text-red-500">{forgotMutation.error?.message}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="teacher@school.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <Button type="submit" disabled={forgotMutation.isPending} className="w-full">
              {forgotMutation.isPending ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-blue-600 hover:underline text-sm">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
