"use client";
import React from "react";
import clsx from "clsx";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  className?: string;
  isRequired?: boolean;
  infoHint?: boolean;
  infoHintText?: string;
};

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    { className, isRequired, infoHintText, infoHint = false, ...props },
    ref
  ) => {
    const id = React.useId();
    return (
      <label
        ref={ref}
        className={clsx(
          "mb-2 flex items-center space-x-1 text-sm sm:text-base relative leading-[13.5px] font-[500] text-white",
          infoHint && "mb-3",
          className
        )}
        {...props}
      >
        <span>{props.children}</span>
        {isRequired && (
          <span className="min-w-[6px] w-[6px] ml-2 h-[6px] rounded-full bg-orange-one"></span>
        )}
        {infoHint && (
          <div className="flex items-center gap-2 group">
            <div
              className="px-[11px] py-[9px] hidden absolute left-[70px] w-fit line-clamp-3 max-w-[300px] group-hover:block rounded-[6px] border border-gray-150 bg-gray-50"
              key={id}
            >
              <p className="text-xs">{infoHintText}</p>
            </div>
          </div>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";
