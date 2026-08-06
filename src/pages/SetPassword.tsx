import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../contexts/AuthContext";
import { useSetPassword } from "../features/auth/api";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "../features/auth/utils/validationSchema";
import { getPostAuthPath } from "../features/auth/utils/routing";
import { authApi } from "../services/auth";
import { tokenStorage, refreshTokenStorage } from "../utils/storage";
import { AuthLayout } from "../layouts/AuthLayout";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export const SetPassword = () => {
  const { user, setTokens } = useAuth();
  const navigate = useNavigate();
  const setPasswordMutation = useSetPassword();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSubmit = (data: ResetPasswordFormData) => {
    setPasswordMutation.mutate(
      { password: data.password },
      {
        onSuccess: async () => {
          const me = await authApi.me();
          setTokens(
            tokenStorage.getToken() ?? "",
            refreshTokenStorage.get() ?? "",
            { ...me, needsRegistration: false },
          );
          navigate(getPostAuthPath({ ...me, needsRegistration: false }), {
            replace: true,
          });
        },
      },
    );
  };

  return (
    <AuthLayout>
      <div className="lg:max-w-85.5">
        <h1 className="text-[32px] font-medium text-gray-900">Set a password</h1>
        <p className="text-sm mt-2" style={{ color: "#9098AC" }}>
          Create a password for your account so you can log in with it next time.
        </p>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-5.25">
          <Input type="email" value={user?.email ?? ""} readOnly className="mb-4" />

          <div className="mb-5">
            <Input
              type="password"
              placeholder="Enter a password"
              showPasswordToggle
              registration={form.register("password")}
              hasError={form.formState.errors.password}
            />
          </div>

          <Input
            type="password"
            placeholder="Confirm password"
            showPasswordToggle
            registration={form.register("confirmPassword")}
            hasError={form.formState.errors.confirmPassword}
          />

          <Button
            type="submit"
            disabled={setPasswordMutation.isPending}
            className="w-full mt-5.25"
          >
            {setPasswordMutation.isPending ? "Setting password..." : "Set password"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};