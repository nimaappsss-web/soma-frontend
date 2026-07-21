import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import {
  loginSendOTPSchema,
  type LoginSendOTPFormData,
} from "../utils/validationSchema";

interface EmailFormProps {
  onSubmit: (data: LoginSendOTPFormData) => void;
  onSendOTP: (data: LoginSendOTPFormData) => void;
  isPending: boolean;
}

export interface EmailFormHandle {
  submitOTP: () => void;
}

export const EmailForm = forwardRef<EmailFormHandle, EmailFormProps>(
  ({ onSubmit, onSendOTP, isPending }, ref) => {
    const form = useForm<LoginSendOTPFormData>({
      resolver: zodResolver(loginSendOTPSchema),
      defaultValues: { email: "" },
      mode: "onBlur",
    });

    useImperativeHandle(ref, () => ({
      submitOTP: () => form.handleSubmit(onSendOTP)(),
    }));

    return (
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <Input
            type="email"
            placeholder="Enter your email"
            registration={form.register("email")}
            hasError={form.formState.errors.email}
            className="mt-5.25"
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full mt-5.25">
          {isPending ? "Checking..." : "Continue with email"}
        </Button>
      </form>
    );
  },
);

EmailForm.displayName = "EmailForm";
