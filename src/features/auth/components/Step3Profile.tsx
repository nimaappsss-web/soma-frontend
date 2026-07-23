import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { PhoneInputField } from "../../../components/ui/phone-input";
import { ErrorMessage } from "../../../components/others/ErrorMessage";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Step3ProfileProps {
  email: string;
  onSubmit: (data: ProfileFormData) => void;
  isPending: boolean;
  error: React.ReactNode;
  errorActionMessage?: string;
  errorAction?: React.ReactNode;
}

export const Step3Profile = ({
  email,
  onSubmit,
  isPending,
  error,
  errorActionMessage,
  errorAction,
}: Step3ProfileProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", password: "" },
  });

  const phoneValue = watch("phone");

  return (
    <div className="min-h-screen bg-pureWhite flex flex-col pb-5 px-5">
      <header className="flex items-center justify-between px-8 h-13.25 lg:px-5">
        <Link to="/" className="flex items-center">
          <img src="/icons/somawordmark_black.svg" alt="Soma" className="h-4" />
        </Link>
        <span className="text-xs text-gray-400">
          Have a question?{" "}
          <a href="#" className="text-gray-600 underline hover:text-gray-900">
            Contact us
          </a>
        </span>
      </header>

      <main className="px-5 pb-5 flex-1 flex flex-col bg-offWhite shadow-sm rounded-[20px]">
        <div className="flex-1 flex items-start justify-center pt-12 lg:pt-20">
          <div className="w-full max-w-85.5">
            {errorAction ? (
              <div className="mb-4">
                <ErrorMessage action={errorAction}>
                  {errorActionMessage}
                </ErrorMessage>
              </div>
            ) : (
              error && (
                <div className="mb-4">
                  <ErrorMessage>{error}</ErrorMessage>
                </div>
              )
            )}

            <h1 className="text-[22px] font-medium text-gray-900">
              Setup account
            </h1>
            <p className="text-sm text-black/50 mt-2 font-light text-start">
              {" "}
              Track academic progress, manage school data, and streamline
              administrative workflows.{" "}
            </p>

            <div className="mt-6">
              <label className="text-xs text-gray-500">Email</label>
              <p className="text-sm font-medium text-gray-900 mt-1">{email}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div>
                <Input
                  type="text"
                  placeholder="First name"
                  registration={register("firstName")}
                  hasError={errors.firstName}
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Last name"
                  registration={register("lastName")}
                  hasError={errors.lastName}
                />
              </div>

              <div>
                <PhoneInputField
                  placeholder="Phone number"
                  value={phoneValue}
                  onChange={(val) =>
                    setValue("phone", val, { shouldValidate: true })
                  }
                  defaultCountry="NG"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-2">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  showPasswordToggle
                  registration={register("password")}
                  hasError={errors.password}
                />
              </div>

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Creating..." : "Create my free account"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
