"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import HeroHomeSectionBox from "./HeroHomeSectionBox";

const Globe = dynamic(
  () => import("../ui/globe"),
  { ssr: false }
);

const HeroHomeSection = () => {
  const [mounted, setMounted] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Defer the decorative WebGL globe until the page is idle so it doesn't
    // compete with LCP / interactivity (it sits behind the hero content).
    const start = () => setMounted(true);
    const t = setTimeout(start, 1200);
    const w = typeof window !== "undefined" ? window : undefined;
    const ridle =
      w && "requestIdleCallback" in w
        ? w.requestIdleCallback(() => start(), { timeout: 3000 })
        : null;
    return () => {
      clearTimeout(t);
      if (ridle != null && w && typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(ridle);
      }
    };
  }, []);

  return (
    <div className="w-full h-auto bg-soft-green">
      <div className="container m-auto p-4 relative overflow-hidden">
        {mounted && (
          <Globe
            theta={0.2}
            dark={0}
            scale={1.2}
            diffuse={1.5}
            baseColor="#087F4F"
            markerColor="#F5C400"
            glowColor="#087F4F"
            className={` container left-0 absolute -bottom-[20%] sm:-bottom-[60%] md:-bottom-[80%] lg:-bottom-[120%] xl:-bottom-[130%] m-auto  opacity-50`}
          />
        )}

        <div className="w-full h-auto pt-6 sm:pt-15 pb-6 z-[10] relative flex justify-center text-center align-middle items-center flex-col">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-foreground overflow-hidden z-[10]">
            CROSS CART GLOBAL INTERNATIONAL EXPRESS
          </h1>
          <h2 className="text-base sm:text-2xl md:text-3xl font-semibold text-primary z-[10]">
            CROSS BORDER, CARRYING TRUST
          </h2>
        </div>
        <HeroHomeSectionBox />
      </div>
    </div>
  );
};

export default HeroHomeSection;
