import { useEffect, useState } from "react";

type VisibilityMode = "min" | "max";

export const useResponsiveVisibility = (
  breakpoint: number,
  mode: VisibilityMode = "max"
): boolean => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Function to check and update visibility
    const handleResize = () => {
      const isMatch =
        mode === "max"
          ? window.innerWidth <= breakpoint
          : window.innerWidth >= breakpoint;
      setIsVisible(isMatch);
    };
    handleResize();


    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint, mode]); 

  return isVisible;
};
