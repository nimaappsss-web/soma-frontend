import { useSearchParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAcceptParentInvite } from "../features/auth/api";
import { useAuth } from "../contexts/AuthContext";
import { getPostAuthPath } from "../features/auth/utils/routing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export const ParentSetup = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = decodeURIComponent(searchParams.get("email") || "");
  const navigate = useNavigate();
  const mutation = useAcceptParentInvite();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
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

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>Missing or invalid setup information.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Ask the school to send a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Soma</CardTitle>
          <CardDescription>
            Set your password for <span className="text-blue-600">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mutation.isError && (
              <p className="text-sm text-destructive">
                {(mutation.error as Error)?.message}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Setting up..." : "Set Password & Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
