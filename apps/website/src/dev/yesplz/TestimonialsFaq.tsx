"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, Pizza } from "@repo/icons";
import { useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

const LOVE = [
  {
    name: "Lena M.",
    area: "Neubau",
    quote: "Arrived hotter than my espresso. Absolute chaos in the best way.",
    rotate: -6,
  },
  {
    name: "Jonas K.",
    area: "Leopoldstadt",
    quote: "The tracking glow made me stare at my phone like a spy movie.",
    rotate: 4,
  },
  {
    name: "Sofia R.",
    area: "Mariahilf",
    quote: "Loyalty coins? I am now emotionally attached to dough.",
    rotate: -2,
  },
  {
    name: "Marco T.",
    area: "Wieden",
    quote: "Neapolitan soul with Vienna night energy. yEsplz gets it.",
    rotate: 7,
  },
];

const FAQS = [
  {
    q: "How fast is delivery in Vienna?",
    a: "Most central districts land in about 15–20 minutes when the kitchen is live. The header ETA is the real pulse.",
  },
  {
    q: "Is the dough authentic Neapolitan?",
    a: "Yes — long-fermented dough, high-heat bake, Fior di Latte, and San Marzano sauce. No frozen shortcuts.",
  },
  {
    q: "Can I customize every pizza?",
    a: "Build your perfect pie in the app: base, sauce, cheese, toppings, heat level. Your ritual, your rules.",
  },
  {
    q: "How do loyalty rewards work?",
    a: "Every order stacks coins. Redeem them for free sides, upgrades, and occasional late-night exclusives.",
  },
];

export function TestimonialsFaq() {
  const rootRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(0);

  useGSAP(
    () => {
      gsap.fromTo(
        ".polaroid",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 75%",
            end: "top 40%",
            scrub: 0.6,
          },
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className="relative z-30 -mt-8 overflow-hidden bg-[#080808] px-4 py-28 md:-mt-12 md:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold tracking-[0.35em] text-[#a3ff00] uppercase">
          Local Love Vienna
        </p>
        <h2 className="mt-3 max-w-xl font-[family-name:var(--font-yesplz-display)] text-4xl font-black text-white md:text-6xl">
          Sticky notes from the city.
        </h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LOVE.map((item) => (
            <figure
              key={item.name}
              className="polaroid yesplz-glass relative rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
              style={{ transform: `rotate(${item.rotate}deg)` }}
            >
              <div className="mb-4 aspect-[4/5] rounded-xl bg-gradient-to-br from-[#a3ff00]/25 via-white/5 to-transparent" />
              <blockquote className="font-[family-name:var(--font-yesplz-hand)] text-lg leading-snug text-white/90">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-4 text-xs font-bold tracking-widest text-[#a3ff00] uppercase">
                {item.name} · {item.area}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-28 max-w-3xl">
          <h3 className="font-[family-name:var(--font-yesplz-display)] text-3xl font-black text-white md:text-4xl">
            FAQ
          </h3>
          <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={item.q}>
                  <button
                    type="button"
                    data-cursor="Open"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center gap-4 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`inline-flex size-8 shrink-0 items-center justify-center text-[#a3ff00] transition-transform duration-500 ${
                        isOpen ? "rotate-[360deg]" : ""
                      }`}
                      aria-hidden
                    >
                      <Pizza size={22} />
                    </span>
                    <span className="flex-1 text-base font-bold text-white md:text-lg">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`size-5 text-[#a3ff00] transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-500 ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-5 pl-12 text-sm leading-relaxed text-white/60 md:text-base">
                        {item.a}
                      </p>
                    </div>
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
