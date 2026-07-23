import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { ErrorMessage } from "../../../components/others/ErrorMessage";
import { transformError } from "../../../utils/transformError";
import { SignupLayout } from "../../../layouts/SignupLayout";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface Step1EmailProps {
  onSubmit: (data: EmailFormData) => void;
  onGoogleClick: () => void;
  isPending: boolean;
  error: React.ReactNode;
}

export const Step1Email = ({ onSubmit, onGoogleClick, isPending, error }: Step1EmailProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  return (
    <SignupLayout>
      <div className="w-full">
        <div className="flex justify-center">
          <img src="/icons/somawordmark_black.svg" alt="Soma" className="h-[30px] w-auto mb-8" />
        </div>

        <div className="text-center">
          <h1 className="text-[24px] mx-auto text-center font-light text-gray-900 leading-snug min-w-[464px]">
            Track academic progress, manage school data, and streamline administrative workflows.
          </h1>
        </div>

        {error && (
          <div className="mt-5">
            <ErrorMessage>{transformError(error)}</ErrorMessage>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5 w-[342px] mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            registration={register("email")}
            hasError={errors.email}
          />

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Sending..." : "Sign up with email"}
          </Button>
        </form>

        <div className="relative mt-5 mb-5 w-[342px] mx-auto">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-offWhite px-3 text-gray-400">Or</span>
          </div>
        </div>

        <div className="w-[342px] mx-auto mt-5 mb-5">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-full bg-pureWhite flex items-center justify-center gap-2.5 border-gray-200"
            onClick={onGoogleClick}
          >
            <img src="/icons/googleIcon.svg" alt="Google" className="w-4 h-4" />
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-gray-900 font-medium underline hover:text-gray-700">
            Log in
          </Link>
        </p>
      </div>
    </SignupLayout>
  );
};
