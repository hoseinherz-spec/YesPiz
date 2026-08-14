"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useRef } from "react";

import { landingImages } from "@/content/images";

gsap.registerPlugin(ScrollTrigger);

const HERO_LINE = "HOT YESPIZZ DELIVERY";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pizzaRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLParagraphElement>(null);
  const solidRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const letters = titleRef.current?.querySelectorAll(".hero-letter");
      if (letters?.length) {
        gsap.fromTo(
          letters,
          { yPercent: 120, rotate: -8, opacity: 0 },
          {
            yPercent: 0,
            rotate: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.028,
            ease: "power3.out",
            delay: 0.15,
          },
        );
      }

      gsap.fromTo(
        [outlineRef.current, pizzaRef.current, solidRef.current],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.35,
        },
      );

      const pizza = pizzaRef.current;
      const box = boxRef.current;
      const section = sectionRef.current;
      if (!pizza || !box || !section) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1.1,
            pin: stageRef.current,
            anticipatePin: 1,
          },
        });

        tl.to(
          outlineRef.current,
          { scale: 1.15, opacity: 0.15, y: -80, ease: "none" },
          0,
        )
          .to(solidRef.current, { y: 120, opacity: 0, ease: "none" }, 0)
          .to(
            pizza,
            {
              y: () => {
                const pizzaRect = pizza.getBoundingClientRect();
                const boxRect = box.getBoundingClientRect();
                return boxRect.top + boxRect.height / 2 - (pizzaRect.top + pizzaRect.height / 2);
              },
              scale: 0.72,
              borderRadius: 24,
              ease: "none",
            },
            0,
          )
          .to(box, { opacity: 1, scale: 1, ease: "none" }, 0.35);

        return () => tl.kill();
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative z-10 min-h-[180vh] bg-[#080808] pt-28 md:pt-32"
    >
      <div ref={stageRef} className="relative flex min-h-dvh flex-col justify-center px-4 pb-24 md:px-8">
        <h1
          ref={titleRef}
          className="mx-auto mb-8 max-w-6xl text-center font-[family-name:var(--font-yesplz-display)] text-[clamp(2.4rem,9vw,7.5rem)] leading-[0.88] font-black tracking-[-0.03em] text-white md:mb-12"
          aria-label={HERO_LINE}
        >
          {HERO_LINE.split(" ").map((word, wi) => (
            <span key={word} className="mr-[0.18em] inline-block whitespace-nowrap last:mr-0">
              {word.split("").map((ch, i) => (
                <span key={`${wi}-${i}`} className="inline-block overflow-hidden align-bottom">
                  <span className="hero-letter inline-block will-change-transform">
                    {ch}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </h1>

        <div className="relative mx-auto flex h-[min(62vh,560px)] w-full max-w-5xl items-center justify-center">
          <p
            ref={outlineRef}
            className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 text-center font-[family-name:var(--font-yesplz-display)] text-[clamp(3rem,18vw,11rem)] leading-none font-black tracking-[-0.04em] text-transparent [-webkit-text-stroke:1.5px_rgba(163,255,0,0.45)]"
          >
            NEAPOLITAN
          </p>

          <div
            ref={pizzaRef}
            data-cursor="Drag"
            className="relative z-[2] aspect-square w-[min(72vw,420px)] overflow-hidden rounded-[2rem] shadow-[0_0_80px_rgba(163,255,0,0.18)] will-change-transform"
          >
            <Image
              src={landingImages.hero}
              alt="Hot Neapolitan pizza"
              fill
              priority
              className="object-cover"
              sizes="420px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          <p
            ref={solidRef}
            className="pointer-events-none absolute right-[4%] bottom-[12%] z-[3] -rotate-3 font-[family-name:var(--font-yesplz-display)] text-[clamp(2.5rem,10vw,6rem)] leading-none font-black tracking-tight text-[#a3ff00] md:right-[8%]"
          >
            REDEFINED.
          </p>
        </div>

        <p className="mx-auto mt-10 max-w-md text-center text-sm text-white/55 md:text-base">
          Vienna&apos;s neon-lit Neapolitan kitchen — fired hot, delivered in
          minutes, never lukewarm.
        </p>
      </div>

      {/* Landing box for the pizza handoff */}
      <div className="pointer-events-none absolute inset-x-0 bottom-16 z-20 flex justify-center px-4 md:bottom-24">
        <div
          ref={boxRef}
          className="yesplz-glass relative h-40 w-full max-w-md scale-95 rounded-3xl opacity-0 md:h-48"
        >
          <div className="absolute inset-3 rounded-2xl border border-dashed border-[#a3ff00]/35" />
          <span className="absolute -top-3 left-6 rounded-full bg-[#a3ff00] px-3 py-1 text-[10px] font-black tracking-widest text-black uppercase">
            Into the box
          </span>
        </div>
      </div>
    </section>
  );
}
