import { useSearchParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAcceptParentInvite } from "../features/auth/api";
import { useAuth } from "../contexts/AuthContext";
import { getPostAuthPath } from "../features/auth/utils/routing";
import { AuthLayout } from "../layouts/AuthLayout";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export const AcceptParentInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const identifier =
    decodeURIComponent(searchParams.get("email") || "") ||
    decodeURIComponent(searchParams.get("phone") || "");
  const navigate = useNavigate();
  const mutation = useAcceptParentInvite();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(
      { token, password: data.password },
      {
        onSuccess: (res) => {
          login(res);
          navigate(getPostAuthPath(res.user));
        },
      },
    );
  };

  if (!token) {
    return (
      <AuthLayout>
        <div className="lg:max-w-85.5">
          <h1 className="text-[32px] font-medium text-gray-900">Invalid Link</h1>
          <p className="text-sm mt-2" style={{ color: "#9098AC" }}>
            Missing or invalid setup information. Ask the school to send a new invitation.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="lg:max-w-85.5">
        <h1 className="text-[32px] font-medium text-gray-900">Set your password</h1>
        <p className="text-sm mt-2" style={{ color: "#9098AC" }}>
          Welcome to Soma. Create a password for your{" "}
          {identifier.includes("@") ? "account" : "phone number"} so you can log in with it next
          time.
        </p>

        {mutation.isError && (
          <p className="text-sm text-destructive mt-4">
            {(mutation.error as Error)?.message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5.25">
          <Input value={identifier} readOnly className="mb-4" placeholder="Phone or email" />

          <div className="mb-5">
            <Input
              type="password"
              placeholder="Enter a password"
              showPasswordToggle
              registration={register("password")}
              hasError={errors.password}
            />
          </div>

          <Input
            type="password"
            placeholder="Confirm password"
            showPasswordToggle
            registration={register("confirmPassword")}
            hasError={errors.confirmPassword}
          />

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full mt-5.25"
          >
            {mutation.isPending ? "Setting up..." : "Set password & login"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};