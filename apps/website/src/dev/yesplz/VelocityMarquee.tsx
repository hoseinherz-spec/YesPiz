"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const PHRASE =
  "FRESH OUT OF THE OVEN — 15 MIN DELIVERY IN VIENNA — HOT & CHEESY — yEsplz — ";

export function VelocityMarquee() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      const root = rootRef.current;
      if (!track || !root) return;

      const tween = gsap.to(track, {
        xPercent: -50,
        duration: 28,
        ease: "none",
        repeat: -1,
      });

      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 1800, 3.5);
          tween.timeScale(boost);
        },
      });

      return () => {
        tween.kill();
      };
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className="relative z-30 -mt-10 rotate-[-1.5deg] overflow-hidden bg-[#a3ff00] py-4 md:-mt-16 md:py-5"
      aria-hidden
    >
      <div className="flex whitespace-nowrap">
        <div
          ref={trackRef}
          className="flex will-change-transform font-[family-name:var(--font-yesplz-display)] text-2xl font-black tracking-tight text-black uppercase md:text-4xl lg:text-5xl"
        >
          <span className="pr-8">{PHRASE.repeat(4)}</span>
          <span className="pr-8">{PHRASE.repeat(4)}</span>
        </div>
      </div>
    </section>
  );
}
