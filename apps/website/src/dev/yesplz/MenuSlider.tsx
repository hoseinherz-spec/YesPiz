"use client";

import { useGSAP } from "@gsap/react";
import {
  Apple,
  Fire1,
  Garlic,
  Leaf,
  Pizza,
  type IconProps,
} from "@repo/icons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import type { ComponentType } from "react";
import { useRef } from "react";

import { landingImages } from "@/content/images";

gsap.registerPlugin(ScrollTrigger);

const PIZZAS = [
  {
    name: "PEPPERONI",
    blurb: "Spicy salami, molten mozzarella, kiln-kissed crust.",
    image: landingImages.pizzaPepperoni,
  },
  {
    name: "MARGHERITA",
    blurb: "San Marzano, fior di latte, basil — Vienna classic.",
    image: landingImages.margheritaDark,
  },
  {
    name: "VEGGIE",
    blurb: "Garden heat with roasted peppers and wild greens.",
    image: landingImages.pizzaVeggie,
  },
  {
    name: "MEAT FEAST",
    blurb: "Layered proteins for late-night appetites.",
    image: landingImages.pizzaMeatFeast,
  },
];

const FLOATERS: {
  Icon: ComponentType<IconProps>;
  x: string;
  y: string;
}[] = [
  { Icon: Apple, x: "12%", y: "22%" },
  { Icon: Leaf, x: "78%", y: "18%" },
  { Icon: Pizza, x: "18%", y: "72%" },
  { Icon: Fire1, x: "82%", y: "68%" },
  { Icon: Garlic, x: "50%", y: "12%" },
];

export function MenuSlider() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const bgTextRef = useRef<HTMLParagraphElement>(null);
  const floaterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const track = trackRef.current;
      const pin = pinRef.current;
      const bg = bgTextRef.current;
      if (!root || !track || !pin || !bg) return;

      const total = PIZZAS.length;
      const getScroll = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const tween = gsap.to(track, {
        x: () => -getScroll(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${getScroll() + window.innerHeight * 0.6}`,
          scrub: 1,
          pin: pin,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(
              total - 1,
              Math.floor(self.progress * total),
            );
            const name = PIZZAS[idx]?.name ?? "";
            if (bg.dataset.name !== name) {
              bg.dataset.name = name;
              gsap.fromTo(
                bg,
                { scale: 1.12, opacity: 0.15 },
                { scale: 1, opacity: 0.12, duration: 0.45, ease: "power2.out" },
              );
              bg.textContent = name;
            }
          },
        },
      });

      const onMove = (e: MouseEvent) => {
        const cx = e.clientX / window.innerWidth - 0.5;
        const cy = e.clientY / window.innerHeight - 0.5;
        floaterRefs.current.forEach((el, i) => {
          if (!el) return;
          const depth = (i + 1) * 18;
          gsap.to(el, {
            x: -cx * depth,
            y: -cy * depth,
            duration: 0.6,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
      };

      window.addEventListener("mousemove", onMove);

      return () => {
        window.removeEventListener("mousemove", onMove);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className="relative z-20 bg-[#080808]"
      aria-label="Menu slider"
    >
      <div
        ref={pinRef}
        className="relative flex h-dvh items-center overflow-hidden"
      >
        <p
          ref={bgTextRef}
          data-name={PIZZAS[0].name}
          className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 text-center font-[family-name:var(--font-yesplz-display)] text-[clamp(3.5rem,22vw,14rem)] leading-none font-black tracking-[-0.05em] text-white/10"
        >
          {PIZZAS[0].name}
        </p>

        {FLOATERS.map((f, i) => {
          const Icon = f.Icon;
          return (
            <span
              key={`${f.x}-${f.y}`}
              ref={(el) => {
                floaterRefs.current[i] = el;
              }}
              className="pointer-events-none absolute z-[2] text-[#a3ff00] opacity-70"
              style={{ left: f.x, top: f.y }}
              aria-hidden
            >
              <Icon
                className="size-8 md:size-12"
                size={48}
                color="currentColor"
                secondaryColor="currentColor"
              />
            </span>
          );
        })}

        <div className="absolute top-24 left-4 z-10 md:left-8">
          <p className="text-[11px] font-semibold tracking-[0.35em] text-[#a3ff00] uppercase">
            Scroll Menu
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-yesplz-display)] text-3xl font-black text-white md:text-5xl">
            Pick your heat.
          </h2>
        </div>

        <div
          ref={trackRef}
          className="relative z-[3] flex gap-8 px-[12vw] will-change-transform md:gap-14"
        >
          {PIZZAS.map((pizza) => (
            <article
              key={pizza.name}
              data-cursor="Eat Me"
              className="yesplz-glass relative w-[min(78vw,420px)] shrink-0 overflow-hidden rounded-[2rem] p-4"
            >
              <div className="relative aspect-square overflow-hidden rounded-[1.5rem]">
                <Image
                  src={pizza.image}
                  alt={pizza.name}
                  fill
                  className="object-cover"
                  sizes="420px"
                />
              </div>
              <h3 className="mt-5 font-[family-name:var(--font-yesplz-display)] text-3xl font-black tracking-tight text-white">
                {pizza.name}
              </h3>
              <p className="mt-2 text-sm text-white/60">{pizza.blurb}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
