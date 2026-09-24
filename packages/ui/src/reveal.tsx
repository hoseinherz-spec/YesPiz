"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** transitions.dev text reveal; enhancement never hides server-rendered content. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const block = element.current;
    if (!block) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    block.dataset.motionReady = "true";
    block.classList.remove("is-shown");
    void block.offsetHeight;
    block.classList.add("is-shown");
    return () => { delete block.dataset.motionReady; };
  }, []);
  return <div ref={element} className={`t-stagger ${className}`}>{children}</div>;
}
