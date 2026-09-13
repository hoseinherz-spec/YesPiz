"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAnimationActive } from "@/hooks/use-animation-active";
import { galada } from "@repo/theme/display-font";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ChevronLeft, ChevronRight, Fire1 } from "@repo/icons";
import { APP_WEB_URL } from "@/content/app-links";
import { landingImages } from "@/content/images";
import { cn } from "@/lib/utils";
import "./landing-pizza-menu-section.css";

const { ingredients } = landingImages;

type FlavorId = "classic" | "ember";

type Floater = {
  src: string;
  alt: string;
};

type Flavor = {
  id: FlavorId;
  name: string;
  price: string;
  product: string;
  cardImage: string;
  floaters: Floater[];
  titleLeft: [string, string];
  titleRight: [string, string];
  description: string;
  colors: { inner: string; mid: string; outer: string };
};

const FLAVORS: Record<FlavorId, Flavor> = {
  classic: {
    id: "classic",
    name: "Classic Pepperoni",
    price: "€12.90",
    product: landingImages.pizzaPepperoni,
    cardImage: landingImages.pizzaPepperoni,
    floaters: [
      { src: ingredients.pepperoni, alt: "Pepperoni" },
      { src: ingredients.basil, alt: "Basil" },
      { src: ingredients.mozzarella, alt: "Mozzarella" },
      { src: ingredients.tomato, alt: "Tomato" },
    ],
    titleLeft: ["Fired", "Hot"],
    titleRight: ["Oven", "Ready"],
    description:
      "Golden crust, molten mozzarella, and generous pepperoni — kiln-kissed and ready for Vienna.",
    colors: { inner: "#5a6b00", mid: "#222a00", outer: "#0a0c00" },
  },
  ember: {
    id: "ember",
    name: "Garden Veggie",
    price: "€11.90",
    product: landingImages.pizzaVeggie,
    cardImage: landingImages.pizzaVeggie,
    floaters: [
      { src: ingredients.mushroom, alt: "Mushroom" },
      { src: ingredients.pepper, alt: "Bell pepper" },
      { src: ingredients.olive, alt: "Olives" },
      { src: ingredients.basil, alt: "Basil" },
    ],
    titleLeft: ["Fresh", "Green"],
    titleRight: ["Garden", "Heat"],
    description:
      "Roasted peppers, olives, and wild greens on blistered dough — colorful, bright, and packed with garden flavor.",
    colors: { inner: "#8a2b0b", mid: "#4e1404", outer: "#140401" },
  },
};

const FLOAT_DURATIONS = [5, 7, 6, 8];
const FLOATER_COUNT = 4;
/** Indices 0–2 sit in the foreground layer; 3 sits behind the pizza. */
const FG_INDICES = [0, 1, 2] as const;
const BG_INDICES = [3] as const;

type FloaterState = {
  rx: number;
  ry: number;
  angle: number;
  baseX: number;
  baseY: number;
};

function createFloaterStates(count: number): FloaterState[] {
  return Array.from({ length: count }, () => ({
    rx: 0,
    ry: 0,
    angle: Math.random() * 360,
    baseX: 0,
    baseY: 0,
  }));
}

export function LandingPizzaMenuSection() {
  const rootRef = useRef<HTMLElement>(null);
  const active = useAnimationActive(rootRef);
  const { contextSafe } = useGSAP({ scope: rootRef });
  const productRef = useRef<HTMLDivElement>(null);
  const floatersFgRef = useRef<HTMLDivElement>(null);
  const floatersBgRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const floaterElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const bubblesRef = useRef<HTMLDivElement>(null);

  const floaterStateRef = useRef(createFloaterStates(FLOATER_COUNT));
  const switchSpinRef = useRef(0);
  const isSwitchingRef = useRef(false);
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const currentMouseRef = useRef({ x: 0, y: 0 });
  const flavorRef = useRef<FlavorId>("classic");

  const [flavorId, setFlavorId] = useState<FlavorId>("classic");
  const [productSrc, setProductSrc] = useState(FLAVORS.classic.product);
  const [floaters, setFloaters] = useState(FLAVORS.classic.floaters);

  const flavor = FLAVORS[flavorId];

  const applyThemeColors = useCallback((id: FlavorId, animate: boolean) => {
    const root = rootRef.current;
    if (!root) return;
    const colors = FLAVORS[id].colors;

    if (!animate) {
      root.style.setProperty("--lpm-bg-inner", colors.inner);
      root.style.setProperty("--lpm-bg-mid", colors.mid);
      root.style.setProperty("--lpm-bg-outer", colors.outer);
      root.classList.toggle("is-ember", id === "ember");
      return;
    }

    gsap.to(root, {
      "--lpm-bg-inner": colors.inner,
      "--lpm-bg-mid": colors.mid,
      "--lpm-bg-outer": colors.outer,
      duration: 1.5,
      ease: "power2.inOut",
    });
    root.classList.toggle("is-ember", id === "ember");
  }, []);

  const switchFlavor = useCallback(
    (nextId: FlavorId) => {
      contextSafe((nextId: FlavorId) => {
        if (
          isSwitchingRef.current ||
          switchSpinRef.current !== 0 ||
          nextId === flavorRef.current
        )
          return;
        isSwitchingRef.current = true;
        flavorRef.current = nextId;
        setFlavorId(nextId);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          applyThemeColors(nextId, false);
          setProductSrc(FLAVORS[nextId].product);
          setFloaters(FLAVORS[nextId].floaters);
          isSwitchingRef.current = false;
          return;
        }
        applyThemeColors(nextId, true);

        const product = productRef.current;
        const center = centerRef.current;
        const floaterEls = floaterElsRef.current.filter(
          Boolean,
        ) as HTMLDivElement[];
        const nextFlavor = FLAVORS[nextId];

        if (product) {
          const spinObj = { val: 0 };
          gsap.to(spinObj, {
            val: 360,
            duration: 0.6,
            ease: "power2.in",
            onUpdate: () => {
              switchSpinRef.current = spinObj.val;
            },
            onComplete: contextSafe(() => {
              setProductSrc(nextFlavor.product);
              gsap.to(spinObj, {
                val: 720,
                duration: 1.5,
                ease: "back.out(0.7)",
                onUpdate: () => {
                  switchSpinRef.current = spinObj.val;
                },
                onComplete: () => {
                  switchSpinRef.current = 0;
                },
              });
            }),
          });
        }

        let completed = 0;
        floaterEls.forEach((floater, i) => {
          const state = floaterStateRef.current[i];
          if (!state) return;

          const bW = floater.offsetWidth / 2;
          const bH = floater.offsetHeight / 2;
          const centerX = window.innerWidth / 2 - floater.offsetLeft - bW;
          const centerY = window.innerHeight / 2 - floater.offsetTop - bH;
          const startAngle = state.angle;
          const currentBaseX = state.baseX;
          const currentBaseY = state.baseY;
          const nextBaseX = (Math.random() - 0.5) * 160;
          const nextBaseY = (Math.random() - 0.5) * 160;

          gsap.set(floater, {
            rotation: startAngle,
            x: currentBaseX,
            y: currentBaseY,
          });

          const berryTl = gsap.timeline();
          berryTl
            .to(floater, {
              x: centerX,
              y: centerY,
              rotation: startAngle + 45,
              scale: 0.1,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in",
              onComplete: () => {
                if (i === 0) setFloaters(nextFlavor.floaters);
                if (center) center.style.zIndex = "50";
              },
            })
            .to(floater, { duration: 0.3 })
            .to(floater, {
              onStart: () => {
                if (center) center.style.zIndex = "1";
              },
              x: nextBaseX,
              y: nextBaseY,
              rotation: startAngle + 90,
              scale: 1,
              opacity: 1,
              duration: 0.9,
              ease: "back.out(1.5)",
              onComplete: () => {
                state.angle = startAngle + 90;
                state.baseX = nextBaseX;
                state.baseY = nextBaseY;
                state.rx = 0;
                state.ry = 0;
                gsap.set(floater, {
                  clearProps: "x,y,rotation,scale,opacity",
                });
                floater.style.transform = `translate(${nextBaseX}px, ${nextBaseY}px) rotate(${startAngle + 90}deg)`;
                floater.style.opacity = "1";

                completed += 1;
                if (completed === floaterEls.length) {
                  isSwitchingRef.current = false;
                }
              },
            });
        });

        if (floaterEls.length === 0) {
          setFloaters(nextFlavor.floaters);
          isSwitchingRef.current = false;
        }
      })(nextId);
    },
    [contextSafe, applyThemeColors],
  );

  const goPrev = useCallback(() => {
    switchFlavor(flavorRef.current === "classic" ? "ember" : "classic");
  }, [switchFlavor]);

  const goNext = useCallback(() => {
    switchFlavor(flavorRef.current === "classic" ? "ember" : "classic");
  }, [switchFlavor]);

  useEffect(() => {
    applyThemeColors("classic", false);
  }, [applyThemeColors]);

  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    if (!root) return;
    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth - 0.5;
      mouseRef.current.y = e.clientY / window.innerHeight - 0.5;
      mouseRef.current.px = e.clientX;
      mouseRef.current.py = e.clientY;
    };

    if (finePointer)
      root.addEventListener("mousemove", onMove, { passive: true });

    let frame = 0;
    let previousTime = 0;
    const animate = (timestamp: number) => {
      const delta = previousTime
        ? Math.min((timestamp - previousTime) / 16.667, 3)
        : 1;
      previousTime = timestamp;
      const time = timestamp * 0.001;
      // Complete layout reads before any transform writes.
      const rects =
        finePointer && !isSwitchingRef.current
          ? floaterElsRef.current.map((el) => el?.getBoundingClientRect())
          : [];
      const follow = 1 - Math.pow(0.95, delta);
      const repel = 1 - Math.pow(0.9, delta);
      const mouse = mouseRef.current;
      const current = currentMouseRef.current;

      current.x += (mouse.x - current.x) * follow;
      current.y += (mouse.y - current.y) * follow;

      const product = productRef.current;
      if (product) {
        const tiltY = current.x * 40 + switchSpinRef.current;
        const tiltX = current.y * -20;
        product.style.transform = `translate(-50%, -50%) rotate(${12 + tiltY * 0.15}deg) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`;
      }

      if (floatersFgRef.current) {
        floatersFgRef.current.style.transform = `translate(${current.x * 60}px, ${current.y * 60}px)`;
      }
      if (floatersBgRef.current) {
        floatersBgRef.current.style.transform = `translate(${current.x * -30}px, ${current.y * -30}px)`;
      }

      if (!isSwitchingRef.current) {
        floaterElsRef.current.forEach((floater, i) => {
          const state = floaterStateRef.current[i];
          if (!floater || !state) return;

          const rect = rects[i];
          const berryX = rect ? rect.left + rect.width / 2 : mouse.px;
          const berryY = rect ? rect.top + rect.height / 2 : mouse.py;
          const diffX = mouse.px - berryX;
          const diffY = mouse.py - berryY;
          const distance = Math.sqrt(diffX * diffX + diffY * diffY);

          let targetRx = 0;
          let targetRy = 0;
          let speedMult = 1;

          if (distance < 400 && distance > 0.001) {
            const force = (400 - distance) / 400;
            targetRx = (diffX / distance) * force * -80;
            targetRy = (diffY / distance) * force * -80;
            speedMult = 1 + force * 5;
          }

          state.rx += (targetRx - state.rx) * repel;
          state.ry += (targetRy - state.ry) * repel;
          state.angle += 0.2 * speedMult * delta;

          const dur = FLOAT_DURATIONS[i % FLOAT_DURATIONS.length] ?? 6;
          const phase = (time + i * 0.7) * ((Math.PI * 2) / dur);
          const floatY = Math.sin(phase) * 15;
          const floatAngle = Math.cos(phase) * 6;

          floater.style.transform = `translate(${state.rx + state.baseX}px, ${state.ry + state.baseY + floatY}px) rotate(${state.angle + floatAngle}deg)`;
        });
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => {
      root.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [active]);

  useEffect(() => {
    const container = bubblesRef.current;
    if (!container || !active) return;

    const createBubble = () => {
      const bubble = document.createElement("span");
      bubble.className = "landing-pizza-menu__bubble";
      const size = Math.random() * 20 + 10;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.opacity = String(Math.random() * 0.4 + 0.2);
      const duration = Math.random() * 6 + 4;
      bubble.style.animationDuration = `${duration}s`;
      container.appendChild(bubble);
      bubble.addEventListener("animationend", () => bubble.remove(), {
        once: true,
      });
    };

    const interval = window.setInterval(createBubble, 400);
    return () => {
      window.clearInterval(interval);
      container.replaceChildren();
    };
  }, [active]);

  const renderFloater = (index: number) => {
    const item = floaters[index];
    if (!item) return null;
    return (
      <div
        key={`floater-${index}`}
        ref={(el) => {
          floaterElsRef.current[index] = el;
        }}
        className={cn(
          "landing-pizza-menu__floater",
          `landing-pizza-menu__floater--${index + 1}`,
        )}
      >
        <Image
          src={item.src}
          alt={item.alt}
          width={220}
          height={220}
          draggable={false}
        />
      </div>
    );
  };

  return (
    <section
      ref={rootRef}
      id="menu"
      data-animation-active={active}
      aria-label="Pizza menu showcase"
      className={cn("landing-pizza-menu", galada.variable)}
      style={
        {
          "--lpm-bg-inner": flavor.colors.inner,
          "--lpm-bg-mid": flavor.colors.mid,
          "--lpm-bg-outer": flavor.colors.outer,
        } as CSSProperties
      }
    >
      <div
        ref={bubblesRef}
        className="landing-pizza-menu__bubbles"
        aria-hidden
      />

      <div className="landing-pizza-menu__hero">
        <div className="landing-pizza-menu__content">
          <div className="landing-pizza-menu__left">
            <h2 className="landing-pizza-menu__title">
              <span>{flavor.titleLeft[0]}</span>
              <br />
              {flavor.titleLeft[1]}
            </h2>
            <p className="landing-pizza-menu__description">
              {flavor.description}
            </p>
            <a href={APP_WEB_URL} className="landing-pizza-menu__cta">
              Order Now
              <span className="landing-pizza-menu__cta-plus" aria-hidden>
                +
              </span>
            </a>
            <div className="landing-pizza-menu__badge">
              <div className="landing-pizza-menu__badge-icon">
                <Fire1
                  size={22}
                  color="currentColor"
                  secondaryColor="currentColor"
                />
              </div>
              <div>
                <span className="landing-pizza-menu__badge-title">
                  VIENNA KITCHEN
                </span>
                <span className="landing-pizza-menu__badge-subtitle">
                  NEAPOLITAN CRAFT 2026
                </span>
              </div>
            </div>
          </div>

          <div
            ref={floatersBgRef}
            className="landing-pizza-menu__floaters-bg"
            aria-hidden
          >
            {BG_INDICES.map(renderFloater)}
          </div>

          <div ref={centerRef} className="landing-pizza-menu__center">
            <div ref={productRef} className="landing-pizza-menu__product">
              <Image
                src={productSrc}
                alt={flavor.name}
                width={640}
                height={640}
                sizes="(max-width: 1200px) 420px, 640px"
                draggable={false}
              />
            </div>
          </div>

          <div
            ref={floatersFgRef}
            className="landing-pizza-menu__floaters"
            aria-hidden
          >
            {FG_INDICES.map(renderFloater)}
          </div>

          <div className="landing-pizza-menu__right">
            <div className="landing-pizza-menu__carousel">
              <div className="landing-pizza-menu__cards">
                {(Object.keys(FLAVORS) as FlavorId[]).map((id) => {
                  const card = FLAVORS[id];
                  return (
                    <button
                      key={id}
                      type="button"
                      className={cn(
                        "landing-pizza-menu__card",
                        flavorId === id && "is-active",
                      )}
                      onClick={() => switchFlavor(id)}
                      aria-pressed={flavorId === id}
                    >
                      <Image
                        src={card.cardImage}
                        alt={card.name}
                        width={140}
                        height={140}
                        style={
                          id === "ember"
                            ? { filter: "brightness(0.85)" }
                            : undefined
                        }
                        draggable={false}
                      />
                      <div className="landing-pizza-menu__card-info">
                        <span>{card.name}</span>
                        <span>{card.price}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="landing-pizza-menu__nav">
                <button
                  type="button"
                  className="landing-pizza-menu__nav-btn"
                  aria-label="Previous pizza"
                  onClick={goPrev}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="landing-pizza-menu__nav-btn"
                  aria-label="Next pizza"
                  onClick={goNext}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <h3 className="landing-pizza-menu__title landing-pizza-menu__side-title">
              <span>{flavor.titleRight[0]}</span>
              <br />
              {flavor.titleRight[1]}
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}
