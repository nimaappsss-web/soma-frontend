import { forwardRef, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                              Content variants                              */
/* -------------------------------------------------------------------------- */

const contentStyles = cva(
  "fixed z-50 bg-pureWhite shadow-lg outline-none transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        center:
          "inset-x-0 bottom-0 w-full rounded-t-2xl max-h-[90dvh] overflow-y-auto data-[state=open]:translate-y-0 data-[state=open]:opacity-100 data-[state=closed]:translate-y-full data-[state=closed]:opacity-0 md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:max-w-lg md:w-[calc(100%-60px)] md:rounded-2xl md:data-[state=open]:-translate-y-1/2 md:data-[state=closed]:-translate-y-1/2 md:data-[state=closed]:scale-95 md:data-[state=open]:scale-100",
        left: "inset-y-0 left-0 h-full w-[min(280px,80vw)] rounded-r-2xl overflow-y-auto data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full",
        right:
          "inset-y-0 right-0 h-full w-[min(280px,80vw)] rounded-l-2xl overflow-y-auto data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full",
        middle:
          "inset-x-0 bottom-0 w-full rounded-t-3xl max-h-[90dvh] overflow-y-auto data-[state=open]:translate-y-0 data-[state=open]:opacity-100 data-[state=closed]:translate-y-full data-[state=closed]:opacity-0 md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:max-w-md md:w-[calc(100%-60px)] md:rounded-2xl md:data-[state=open]:-translate-y-1/2 md:data-[state=closed]:-translate-y-1/2",
      },
    },
    defaultVariants: { variant: "center" },
  },
);

/* -------------------------------------------------------------------------- */
/*                                  Root                                      */
/* -------------------------------------------------------------------------- */

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    {children}
  </DialogPrimitive.Root>
);

/* -------------------------------------------------------------------------- */
/*                            Trigger / Close                                 */
/* -------------------------------------------------------------------------- */

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/* -------------------------------------------------------------------------- */
/*                                 Overlay                                    */
/* -------------------------------------------------------------------------- */

const DialogOverlay = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

/* -------------------------------------------------------------------------- */
/*                                Content                                     */
/* -------------------------------------------------------------------------- */

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof contentStyles> {
  showClose?: boolean;
}

const DialogContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, variant = "center", showClose = true, children, onInteractOutside, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      className={cn(
        contentStyles({ variant }),
        variant === "center" || variant === "middle" ? "pb-4 md:pb-6" : "",
        className,
      )}
      onInteractOutside={(event) => {
        const target = event.target as HTMLElement | null;
        if (target && target.closest("[data-soma-floating]")) {
          event.preventDefault();
        }
        onInteractOutside?.(event);
      }}
      {...props}
    >
      {(variant === "center" || variant === "middle") && (
        <div className="md:hidden mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-gray200" />
      )}
      {children}
      {showClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 text-gray400 hover:text-gray900 transition-colors focus:outline-none">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
          </svg>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

/* -------------------------------------------------------------------------- */
/*                               Header / Title                               */
/* -------------------------------------------------------------------------- */

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-gray900 leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray500", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

/* -------------------------------------------------------------------------- */
/*                                 Exports                                    */
/* -------------------------------------------------------------------------- */

export {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  contentStyles,
};
