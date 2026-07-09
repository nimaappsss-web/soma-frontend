import { useEffect, useRef } from "react";

export const useAnimatedFavicon = (frames: string[], schedule: number[]) => {
  const framesRef = useRef(frames);
  const scheduleRef = useRef(schedule);
  framesRef.current = frames;
  scheduleRef.current = schedule;

  useEffect(() => {
    // preload
    framesRef.current.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const setIcon = (href: string) => {
      // remove + reinsert forces Chrome to actually repaint the tab icon
      document
        .querySelectorAll("link[rel~='icon']")
        .forEach((el) => el.remove());
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = href;
      document.head.appendChild(link);
    };

    const tick = () => {
      if (cancelled) return;
      setIcon(framesRef.current[index]!);
      const delay = scheduleRef.current[index] ?? scheduleRef.current[0]!;
      index = (index + 1) % framesRef.current.length;
      timer = setTimeout(tick, delay);
    };

    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
};
