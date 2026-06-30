import React from "react";
import clsx from "clsx";

interface EmptyStateProp {
  description: string;
  image?: string;
  icon?: React.ReactNode;
  className?: string;
  textColor?: string;
  imageClassName?: string;
  descriptionClassName?: string;
}
const EmptyState = ({
  description,
  image,
  icon,
  className,
  textColor = "text-gray-500",
  imageClassName,
  descriptionClassName,
}: EmptyStateProp) => {
  return (
    <div
      className={clsx(
        "flex items-center justify-center w-full bg-white-3 mt-4 rounded-[15px]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 items-center justify-center">
        {icon ? (
          <div
            className={clsx(
              "flex items-center justify-center text-[32px]",
              imageClassName,
            )}
          >
            {icon}
          </div>
        ) : image ? (
          <img
            src={image}
            alt="empty-state"
            className={clsx("max-w-49.75 h-auto", imageClassName)}
          />
        ) : null}
        <p
          className={clsx(
            "mx-auto w-101.25 text-center",
            textColor,
            descriptionClassName,
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
