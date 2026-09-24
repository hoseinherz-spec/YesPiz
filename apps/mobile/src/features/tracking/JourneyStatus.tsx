"use client";
import { useEffect, useRef, useState } from "react";
import "./journey-motion.css";
export function JourneyStatus({ children }: { children: string }) {
  const element = useRef<HTMLSpanElement>(null);
  const [initial] = useState(children);
  useEffect(() => {
    const el = element.current;
    if (!el || el.textContent === children) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced
      ? 0
      : parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--text-swap-dur",
          ),
        ) || 150;
    el.classList.add("is-exit");
    const timeout = setTimeout(() => {
      el.textContent = children;
      el.classList.remove("is-exit");
      el.classList.add("is-enter-start");
      void el.offsetHeight;
      el.classList.remove("is-enter-start");
    }, duration);
    return () => {
      clearTimeout(timeout);
      el.classList.remove("is-exit", "is-enter-start");
    };
  }, [children]);
  return (
    <span ref={element} className="t-text-swap">
      {initial}
    </span>
  );
}
