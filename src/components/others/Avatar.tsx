import React from "react";
import clsx from "clsx";

type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "flex items-center uppercase justify-center rounded-full text-white",
          className
        )}
        {...props}
      >
        {props.children}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
