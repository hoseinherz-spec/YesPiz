"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Coins, MapPinned, Pizza } from "@repo/icons";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    n: "01",
    title: "Build Your Perfect Pizza",
    copy: "Layer dough, sauce, and toppings in a tactile builder — every pie starts as your ritual.",
    icon: Pizza,
    align: "left" as const,
    accent: "from-[#a3ff00]/20 to-transparent",
  },
  {
    n: "02",
    title: "Track Your Live Delivery",
    copy: "A dark map, a glowing courier, ETA that breathes — Vienna streets in real time.",
    icon: MapPinned,
    align: "right" as const,
    accent: "from-emerald-400/15 to-transparent",
  },
  {
    n: "03",
    title: "Earn Loyalty Rewards",
    copy: "Stack neon coins with every order. Unlock late-night freebies and kiln-hot exclusives.",
    icon: Coins,
    align: "left" as const,
    accent: "from-amber-300/20 to-transparent",
  },
];

export function CraftTimeline() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".craft-card");
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          {
            y: 80,
            rotate: i % 2 === 0 ? -4 : 4,
            opacity: 0,
          },
          {
            y: 0,
            rotate: i % 2 === 0 ? -1.5 : 2,
            opacity: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 45%",
              scrub: 0.8,
            },
          },
        );
      });

      gsap.fromTo(
        ".craft-spine",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 70%",
            end: "bottom 40%",
            scrub: true,
          },
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className="relative z-20 -mt-24 overflow-hidden bg-[#080808] px-4 pb-32 pt-16 md:-mt-32 md:px-8 md:pt-24"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.35em] text-[#a3ff00] uppercase">
          Our Craft Journey
        </p>
        <h2 className="max-w-2xl font-[family-name:var(--font-yesplz-display)] text-4xl font-black tracking-tight text-white md:text-6xl">
          Not a feature grid.
          <span className="block text-[#a3ff00]">A winding ritual.</span>
        </h2>

        <div className="relative mt-20 md:mt-28">
          <div
            className="craft-spine absolute top-0 left-6 origin-top md:left-1/2 md:-translate-x-px"
            style={{ height: "100%", width: 2 }}
          >
            <div className="h-full w-full bg-gradient-to-b from-[#a3ff00] via-[#a3ff00]/40 to-transparent" />
          </div>

          <ul className="space-y-16 md:space-y-28">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isRight = step.align === "right";
              return (
                <li
                  key={step.n}
                  className={`craft-card relative md:flex ${
                    isRight ? "md:justify-end" : "md:justify-start"
                  }`}
                >
                  <div
                    className={`yesplz-glass relative w-full max-w-lg overflow-hidden rounded-[1.75rem] p-6 md:p-8 ${
                      isRight ? "md:mr-0 md:ml-[8%]" : "md:ml-0 md:mr-[8%]"
                    } ${i === 1 ? "-mt-4 md:-mt-10" : ""} ${
                      i === 2 ? "md:-mt-6" : ""
                    }`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${step.accent}`}
                    />
                    <div className="relative flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#a3ff00]/30 bg-black/40 text-[#a3ff00]">
                        <Icon className="size-6" strokeWidth={1.6} />
                      </div>
                      <div>
                        <p className="font-[family-name:var(--font-yesplz-display)] text-5xl leading-none text-white/10">
                          {step.n}
                        </p>
                        <h3 className="mt-2 text-xl font-black tracking-tight text-white md:text-2xl">
                          {step.title}
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-white/60 md:text-base">
                          {step.copy}
                        </p>
                      </div>
                    </div>

                    {step.n === "01" && (
                      <div className="relative mt-6 flex gap-2">
                        {["Dough", "Sauce", "Mozz", "Basil"].map((chip, idx) => (
                          <span
                            key={chip}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-wider text-white/80 uppercase"
                            style={{ transform: `rotate(${(idx - 1.5) * 3}deg)` }}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}

                    {step.n === "02" && (
                      <div className="relative mt-6 h-28 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1210]">
                        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(163,255,0,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,0,0.15)_1px,transparent_1px)] [background-size:28px_28px]" />
                        <div className="absolute top-1/2 left-[18%] size-3 -translate-y-1/2 rounded-full bg-[#a3ff00] shadow-[0_0_20px_#a3ff00]" />
                        <div className="absolute top-[42%] right-[22%] size-2.5 rounded-full bg-white/80" />
                        <svg className="absolute inset-0 h-full w-full" aria-hidden>
                          <path
                            d="M70 56 C 140 40, 180 90, 260 52"
                            fill="none"
                            stroke="#a3ff00"
                            strokeWidth="2"
                            strokeDasharray="6 6"
                            opacity="0.7"
                          />
                        </svg>
                      </div>
                    )}

                    {step.n === "03" && (
                      <div className="relative mt-6 flex items-end justify-center gap-[-12px] py-2">
                        {[0, 1, 2, 3].map((c) => (
                          <div
                            key={c}
                            className="relative -ml-3 size-14 rounded-full border-2 border-[#a3ff00]/50 bg-gradient-to-b from-[#d4ff6a] to-[#7ab800] shadow-[0_0_24px_rgba(163,255,0,0.35)] first:ml-0"
                            style={{
                              transform: `translateY(${(3 - c) * -6}px) rotate(${c * 8}deg)`,
                              zIndex: c,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
