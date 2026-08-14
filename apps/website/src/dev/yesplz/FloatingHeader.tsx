"use client";

import { APP_WEB_URL } from "@/content/app-links";

export function FloatingHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[100] px-4 pt-4 md:px-8 md:pt-6">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
        <a
          href="#top"
          data-cursor="Home"
          className="pointer-events-auto font-[family-name:var(--font-yesplz-display)] text-2xl font-black tracking-tight text-white md:text-3xl"
        >
          yEsplz
        </a>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          <div className="yesplz-glass hidden items-center gap-2 rounded-full px-3 py-2 text-[10px] font-semibold tracking-[0.12em] text-white/90 uppercase sm:flex sm:px-4 sm:text-[11px]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#a3ff00] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#a3ff00]" />
            </span>
            <span className="whitespace-nowrap">
              Vienna Kitchen: Live — 18 min
            </span>
          </div>

          <a
            href={APP_WEB_URL}
            data-cursor="Eat Me"
            className="rounded-full bg-[#a3ff00] px-4 py-2.5 text-[11px] font-black tracking-[0.14em] text-black uppercase transition-transform hover:scale-[1.03] sm:px-5 sm:text-xs"
          >
            Order Now
          </a>
        </div>
      </div>
    </header>
  );
}
