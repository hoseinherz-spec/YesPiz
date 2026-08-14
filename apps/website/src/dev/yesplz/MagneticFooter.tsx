"use client";

import gsap from "gsap";
import { useRef, type MouseEvent } from "react";

import { APP_WEB_URL } from "@/content/app-links";

export function MagneticFooter() {
  const btnRef = useRef<HTMLAnchorElement>(null);

  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, {
      x: x * 0.35,
      y: y * 0.35,
      duration: 0.35,
      ease: "power3.out",
    });
  };

  const onLeave = () => {
    if (!btnRef.current) return;
    gsap.to(btnRef.current, {
      x: 0,
      y: 0,
      duration: 0.55,
      ease: "elastic.out(1, 0.4)",
    });
  };

  return (
    <footer className="relative z-40 overflow-hidden border-t border-white/10 bg-[#080808] px-4 pt-24 pb-12 md:px-8">
      <p
        className="pointer-events-none absolute inset-x-0 top-10 text-center font-[family-name:var(--font-yesplz-display)] text-[clamp(4rem,28vw,20rem)] leading-none font-black tracking-[-0.06em] text-white/[0.04] select-none"
        aria-hidden
      >
        yEsplz
      </p>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center">
        <p className="text-[11px] font-semibold tracking-[0.35em] text-[#a3ff00] uppercase">
          Vienna · Neapolitan · Live
        </p>
        <h2 className="mt-4 max-w-2xl font-[family-name:var(--font-yesplz-display)] text-4xl font-black text-white md:text-6xl">
          Hungry enough to click?
        </h2>

        <a
          ref={btnRef}
          href={APP_WEB_URL}
          data-cursor="Eat Me"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="mt-12 inline-flex items-center justify-center rounded-full bg-[#a3ff00] px-10 py-5 text-sm font-black tracking-[0.2em] text-black uppercase shadow-[0_0_40px_rgba(163,255,0,0.35)] will-change-transform"
        >
          Order Online
        </a>

        <div className="mt-20 flex w-full flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} yEsplz · Vienna</span>
          <div className="flex gap-6">
            <a href="#top" className="hover:text-[#a3ff00]">
              Top
            </a>
            <a href={APP_WEB_URL} className="hover:text-[#a3ff00]">
              App
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
