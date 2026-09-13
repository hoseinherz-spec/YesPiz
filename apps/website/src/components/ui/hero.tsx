"use client";

import {
  ArrowBendDownLeft2,
  ArrowBendUpRight2,
  Fire1,
  Pizza,
} from "@repo/icons";
import { useRef } from "react";
import Image from "next/image";
import { useAnimationActive } from "@/hooks/use-animation-active";
import { landingImages } from "@/content/images";
import { landingContent } from "@/content/landing";

const hero = landingContent.hero;

const CircularBadge = ({ active }: { active: boolean }) => (
  <div className="relative flex h-28 w-28 rotate-12 cursor-pointer items-center justify-center rounded-full border-[3px] border-brand-olive/5 bg-brand-lime text-brand-olive shadow-xl transition-transform hover:scale-105 md:h-36 md:w-36">
    <div
      className="absolute inset-1 animate-[spin_10s_linear_infinite]"
      style={{ animationPlayState: active ? "running" : "paused" }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <path
          id="circlePath"
          d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
          fill="none"
        />
        <text className="fill-current text-[11px] font-black tracking-[0.18em] uppercase">
          <textPath href="#circlePath" startOffset="0%">
            ORDER FREE • HOT YESPIZZ • ORDER FREE •
          </textPath>
        </text>
      </svg>
    </div>
    <div className="absolute inset-0 flex items-center justify-center text-brand-olive">
      <Pizza size={40} color="currentColor" secondaryColor="currentColor" />
    </div>
  </div>
);

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = useAnimationActive(rootRef);
  return (
    <div
      ref={rootRef}
      className="hero-section relative flex min-h-screen w-full flex-col overflow-hidden font-sans bg-accent"
    >
      <div className="hero-section__grid pointer-events-none absolute inset-0 z-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center justify-center px-4 pt-28 pb-32 md:pt-36 md:pb-48">
        <div className="relative z-10 mx-auto mt-8 mb-16 flex w-full max-w-5xl flex-col items-center justify-center text-center md:mt-10">
          <h1 className="relative z-10 flex w-full flex-col items-center space-y-2 md:space-y-4">
            <span className="sr-only">{hero.seoHeadline}</span>
            <span className="relative z-30 flex w-full justify-start pl-[10%] md:pl-[25%]">
              <span
                aria-hidden="true"
                className="hero-display-text m-0 p-0 text-[clamp(4.5rem,12vw,160px)] leading-[0.85] font-black tracking-tighter text-brand-lime uppercase"
              >
                HOT
              </span>
            </span>

            <span className="relative z-20 flex w-full justify-center">
              <span
                aria-hidden="true"
                className="hero-display-text m-0 p-0 text-[clamp(5rem,15vw,220px)] leading-[0.85] font-black tracking-tighter text-accent-foreground uppercase"
              >
                YESPIZZ
              </span>
            </span>

            <span className="relative z-10 flex w-full justify-start pl-[15%] md:pl-[30%]">
              <span
                aria-hidden="true"
                className="hero-display-text m-0 p-0 text-[clamp(4.5rem,12vw,160px)] leading-[0.85] font-black tracking-tighter text-accent-foreground uppercase"
              >
                CRAFT
              </span>
            </span>
          </h1>

          <div className="pointer-events-none absolute inset-0 h-full w-full">
            <div className="absolute bottom-[0%] left-[0%] z-20 h-24 w-24 text-brand-lime md:left-[10%] md:h-32 md:w-32">
              <ArrowBendDownLeft2
                className="h-full w-full"
                size="100%"
                color="currentColor"
                secondaryColor="currentColor"
              />
            </div>

            <div className="absolute top-[5%] right-[0%] z-20 h-24 w-24 text-brand-lime md:right-[10%] md:h-32 md:w-32">
              <ArrowBendUpRight2
                className="h-full w-full"
                size="100%"
                color="currentColor"
                secondaryColor="currentColor"
              />
            </div>

            <div className="pointer-events-auto absolute right-[0%] bottom-[-10%] z-40 md:right-[15%]">
              <CircularBadge active={active} />
            </div>
          </div>
        </div>
      </div>

      <section className="relative z-20 mt-auto w-full rounded-t-[2.5rem] bg-surface px-6 py-12 text-foreground shadow-[0_-20px_50px_rgba(0,0,0,0.2)] md:rounded-t-[3.5rem] md:px-10 md:py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          <div className="relative flex h-64 flex-col items-center rounded-[2rem] border border-border bg-surface-secondary p-8 text-center">
            <h2 className="mb-2 text-xl leading-tight font-black uppercase md:text-2xl">
              {hero.cards[0].title[0]}
              <br />
              {hero.cards[0].title[1]}
            </h2>
            <p className="mb-auto text-[10px] font-bold text-muted md:text-xs">
              {hero.cards[0].description}
            </p>

            <div className="relative mt-6 flex w-full justify-center">
              <div className="relative z-10 flex items-center rounded-2xl bg-brand-purple p-2 pr-16 text-accent-foreground shadow-lg">
                <div className="mr-3 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-accent-foreground/30 bg-surface-secondary">
                  <Image
                    src={landingImages.margheritaTray}
                    width={32}
                    height={32}
                    alt={hero.cards[0].imageAlt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="text-[10px] leading-none font-bold">
                    Margherita XL
                  </p>
                  <p className="mt-1 text-[8px] leading-none text-accent-foreground/70">
                    extra mozzarella
                  </p>
                </div>
              </div>
              <div className="absolute top-1/2 right-2 z-20 -translate-y-1/2 transform rounded-xl bg-brand-lime px-3 py-2 text-[10px] font-black text-brand-olive shadow-md">
                €12.90
              </div>
            </div>

            <div className="absolute -right-12 bottom-8 z-30 hidden h-16 w-16 text-foreground md:block">
              <ArrowBendUpRight2
                className="h-full w-full"
                size="100%"
                color="currentColor"
                secondaryColor="currentColor"
              />
            </div>
          </div>

          <div className="relative flex h-64 flex-col items-center rounded-[2rem] border border-border bg-surface-secondary p-8 text-center">
            <h2 className="mb-2 text-xl leading-tight font-black uppercase md:text-2xl">
              {hero.cards[1].title[0]}
              <br />
              {hero.cards[1].title[1]}
            </h2>
            <p className="mb-auto text-[10px] font-bold text-muted md:text-xs">
              {hero.cards[1].description}
            </p>

            <div className="relative mt-6 flex w-full justify-center">
              <div className="flex items-center rounded-full bg-brand-purple p-1.5 text-accent-foreground shadow-lg">
                <div className="mr-2 rounded-full bg-accent-foreground/20 px-4 py-2 text-sm font-bold">
                  450°C
                </div>
                <div className="px-4 text-xs font-bold">KILN</div>
              </div>

              <div className="absolute right-1/3 -bottom-6 z-20 rotate-12 transform rounded-full bg-brand-lime p-2.5 text-brand-olive shadow-lg">
                <Fire1
                  size={16}
                  color="currentColor"
                  secondaryColor="currentColor"
                />
              </div>
            </div>

            <div className="absolute -right-12 bottom-8 z-30 hidden h-16 w-16 text-foreground md:block">
              <ArrowBendUpRight2
                className="h-full w-full"
                size="100%"
                color="currentColor"
                secondaryColor="currentColor"
              />
            </div>
          </div>

          <div className="relative flex h-64 flex-col items-center rounded-[2rem] border border-border bg-surface-secondary p-8 text-center">
            <h2 className="mb-2 text-xl leading-tight font-black uppercase md:text-2xl">
              {hero.cards[2].title[0]}
              <br />
              {hero.cards[2].title[1]}
            </h2>
            <p className="mb-auto text-[10px] font-bold text-muted md:text-xs">
              {hero.cards[2].description}
            </p>

            <div className="relative mt-6 flex w-full max-w-[200px] flex-col items-center rounded-[2rem] bg-brand-lime px-6 py-4 text-brand-olive shadow-lg">
              <p className="mb-1 text-[9px] font-bold tracking-wider uppercase">
                Daily dough
              </p>
              <p className="text-xl font-black">Fresh batch</p>
              <div className="absolute -bottom-2 left-8 h-5 w-5 rotate-45 transform bg-brand-lime" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** @deprecated Use `Hero` instead */
export const Component = Hero;
