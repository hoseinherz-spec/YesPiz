"use client";

import gsap from "gsap";
import { useEffect, useRef, useSyncExternalStore } from "react";

function subscribeFinePointer(onStoreChange: () => void) {
  const fine = window.matchMedia("(pointer: fine)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  fine.addEventListener("change", onStoreChange);
  reduce.addEventListener("change", onStoreChange);
  return () => {
    fine.removeEventListener("change", onStoreChange);
    reduce.removeEventListener("change", onStoreChange);
  };
}

function getFinePointerSnapshot() {
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const enabled = useSyncExternalStore(
    subscribeFinePointer,
    getFinePointerSnapshot,
    () => false,
  );

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.classList.add("yesplz-cursor-hidden");

    const dot = dotRef.current;
    if (!dot) return;

    const xTo = gsap.quickTo(dot, "x", { duration: 0.22, ease: "power3.out" });
    const yTo = gsap.quickTo(dot, "y", { duration: 0.22, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const setHover = (active: boolean, text = "") => {
      gsap.to(dot, {
        scale: active ? 3 : 1,
        duration: 0.35,
        ease: "power3.out",
      });
      if (labelRef.current) {
        labelRef.current.textContent = text;
        gsap.to(labelRef.current, {
          opacity: active && text ? 1 : 0,
          duration: 0.2,
        });
      }
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(
        "[data-cursor]",
      ) as HTMLElement | null;
      if (target) {
        setHover(true, target.dataset.cursor || "Eat Me");
      }
    };

    const onOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest?.("[data-cursor]")) return;
      const leaving = (e.target as HTMLElement | null)?.closest?.(
        "[data-cursor]",
      );
      if (leaving) setHover(false);
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      document.documentElement.classList.remove("yesplz-cursor-hidden");
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={dotRef}
      className="pointer-events-none fixed top-0 left-0 z-[9998] flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#a3ff00] mix-blend-difference"
      aria-hidden
    >
      <span
        ref={labelRef}
        className="pointer-events-none text-[7px] font-black tracking-wider text-black uppercase opacity-0"
      />
    </div>
  );
}
