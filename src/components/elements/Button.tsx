import React from "react";
import clsx from "clsx";

import { Loader } from "./Loader";

interface ButtonProps {
  variant?:
    | "primary"
    | "outline"
    | "backdrop"
    | "close"
    | "back"
    | "none"
    | "secondary";

  className?: string;
  children?: React.ReactNode;
  type?: "submit" | "button" | "reset";
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  as?: "button" | "link";
  href?: string | undefined;
  target?: string;
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  disabled = false,
  isLoading = false,
  size = "lg",
  type = "button",
  className,
  children,
  onClick,
  as = "button",
  href,
  target,
  ariaLabel,
}) => {
  const Tag = as === "button" ? "button" : "a";

  if (as === "link" && !href) {
    throw new Error("href is required when button is used as link");
  }

  const sizeClass = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-[20px] sm:px-[34px] py-[10px] sm:py-[24px] sm:h-[61px] text-xs sm:text-base",
  };

  const closeIcon = (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.43513 8.02082L6.371 4.95669L9.43513 1.89256C9.82168 1.506 9.82168 0.864895 9.43513 0.478343C9.04858 0.0917913 8.40747 0.0917913 8.02092 0.478343L4.95679 3.54247L1.89266 0.478343C1.50611 0.0917913 0.864996 0.0917913 0.478444 0.478343C0.0918925 0.864895 0.0918924 1.506 0.478444 1.89256L3.54257 4.95669L0.478444 8.02082C0.0918921 8.40737 0.0918925 9.04848 0.478444 9.43503C0.864996 9.82158 1.50611 9.82158 1.89266 9.43503L4.95679 6.3709L8.02092 9.43503C8.40747 9.82158 9.04858 9.82158 9.43513 9.43503C9.82168 9.04848 9.82168 8.40737 9.43513 8.02082Z"
        fill="currentColor"
      />
    </svg>
  );
  const backIcon = (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.33895 9.87425C8.45052 9.98582 8.5132 10.1371 8.5132 10.2949C8.5132 10.4527 8.45052 10.604 8.33895 10.7156C8.22738 10.8272 8.07605 10.8899 7.91826 10.8899C7.76048 10.8899 7.60915 10.8272 7.49758 10.7156L3.53821 6.75625C3.48284 6.70107 3.43891 6.63551 3.40893 6.56332C3.37896 6.49113 3.36353 6.41373 3.36353 6.33556C3.36353 6.25739 3.37896 6.18 3.40893 6.10781C3.43891 6.03562 3.48284 5.97005 3.53821 5.91488L7.49758 1.9555C7.60915 1.84393 7.76048 1.78125 7.91826 1.78125C8.07605 1.78125 8.22738 1.84393 8.33895 1.9555C8.45052 2.06708 8.5132 2.2184 8.5132 2.37619C8.5132 2.53397 8.45052 2.6853 8.33895 2.79687L4.80075 6.33507L8.33895 9.87425Z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      href={as === "link" ? href : undefined}
      target={as === "link" ? target : undefined}
      aria-label={ariaLabel}
      className={clsx(
        className,
        "rounded-[10px] sm:rounded-[15px] justify-center font-medium sm:font-bold whitespace-nowrap w-fit focus:outline-blue-state disabled:cursor-not-allowed gap-2 disabled:opacity-70 cursor-pointer flex items-center transition-colors duration-100 ",
        variant === "primary" && "bg-primary text-white ",
        variant === "secondary" && "bg-white text-black",
        variant === "outline" && "border border-gray-3 text-white",
        "bg-none border border-black justify-center",
        (variant === "close" || variant === "back") &&
          "text-white bg-white/10 border border-black overflow-hidden rounded-full w-[38px] min-w-[38px] h-[38px]",
        variant !== "close" && variant !== "back" && sizeClass[size],
      )}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {isLoading && <Loader size="md" className="text-current" />}
      {variant === "close"
        ? closeIcon
        : variant === "back"
          ? backIcon
          : children}
    </Tag>
  );
};
