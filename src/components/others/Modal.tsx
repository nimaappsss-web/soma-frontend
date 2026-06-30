import {
  motion,
  AnimatePresence,
  type Variants,
  type VariantLabels,
} from "motion/react";
import { RemoveScroll } from "react-remove-scroll";
import FocusLock from "react-focus-lock";
import ReactDOM from "react-dom";
import React from "react";
import clsx from "clsx";

interface ModalProps {
  showDialog: boolean;
  closeModal: () => void;
  className?: string;
  variant?: "right" | "middle" | "full" | "left";
  children: React.ReactNode;
  modalRef?: React.RefObject<HTMLDivElement | null>;
  backdropClassName?: string;
  style?: React.CSSProperties;
}

const backdropVariants = {
  visible: { opacity: 1, transition: { duration: 0.3 } },
  hidden: { opacity: 0, transition: { duration: 0.3 } },
};

const animationMiddleVariants: Variants = {
  hidden: {
    y: "100vh",
    opacity: 0,
    transition: { duration: 0.3, type: "spring", stiffness: 90 },
  },
  visible: {
    y: "0",
    opacity: 8,
    transition: { duration: 0.3, type: "spring", stiffness: 30 },
  },
};

const animationRightVariants: Variants = {
  hidden: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.5 },
  },
  visible: {
    x: "0%",
    opacity: 100,
    transition: { duration: 0.5 },
  },
};

const animationLeftVariants: Variants = {
  hidden: {
    x: "-100%",
    opacity: 0,
    transition: { duration: 0.5 },
  },
  visible: {
    x: "0%",
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

export const Modal: React.FC<ModalProps> = ({
  showDialog,
  closeModal,
  variant = "center",
  className = "",
  children,
  modalRef,
  backdropClassName = "",
  style,
}) => {
  const [isBrowser, setIsBrowser] = React.useState(false);

  React.useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (!isBrowser) return null;

  let animationVariants: undefined | Variants;
  let exitVariants: undefined | VariantLabels;

  switch (variant) {
    case "middle":
    case "full":
      animationVariants = animationMiddleVariants;
      exitVariants = animationMiddleVariants.hidden as unknown as VariantLabels;
      break;
    case "right":
      animationVariants = animationRightVariants;
      exitVariants = animationRightVariants.hidden as unknown as VariantLabels;
      break;
    case "left":
      animationVariants = animationLeftVariants;
      exitVariants = animationLeftVariants.hidden as unknown as VariantLabels;
      break;
    default:
      break;
  }

  return ReactDOM.createPortal(
    <AnimatePresence onExitComplete={closeModal}>
      {showDialog && (
        <FocusLock>
          <RemoveScroll>
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit={backdropVariants.hidden}
              className={clsx(
                "fixed inset-0 z-50 overflow-y-auto bg-black/40",
                backdropClassName
              )}
            >
              <div className="fixed inset-0 overflow-y-auto overflow-x-hidden">
                <motion.div
                  className={clsx(
                    "",
                    variant === "middle" && "sm:mt-20",
                    className
                  )}
                  style={style}
                  variants={animationVariants}
                  exit={exitVariants}
                  ref={modalRef}
                >
                  {children}
                </motion.div>
              </div>
            </motion.div>
          </RemoveScroll>
        </FocusLock>
      )}
    </AnimatePresence>,
    document.getElementById("modal-root") as HTMLDivElement
  );
};
