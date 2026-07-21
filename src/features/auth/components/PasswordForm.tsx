import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import {
  loginPasswordSchema,
  type LoginPasswordFormData,
} from "../utils/validationSchema";

interface PasswordFormProps {
  onSubmit: (data: LoginPasswordFormData) => void;
  isPending: boolean;
  identifier: string;
}

export const PasswordForm = ({
  onSubmit,
  isPending,
  identifier,
}: PasswordFormProps) => {
  const form = useForm<LoginPasswordFormData>({
    resolver: zodResolver(loginPasswordSchema),
    defaultValues: { email: identifier, password: "" },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <Input type="email" value={identifier} readOnly className="mt-5.25" />
      </div>

      <div className="mt-5">
        <Input
          type="password"
          placeholder="Enter your password"
          showPasswordToggle
          registration={form.register("password")}
          hasError={form.formState.errors.password}
        />
      </div>

      <p className="text-sm text-black/50 mt-2 font-normal">
        Forgot your password?{" "}
        <a href="#" className="text-black underline">
          Reset password
        </a>
      </p>
      <Button type="submit" disabled={isPending} className="w-full mt-5.25">
        {isPending ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
};
