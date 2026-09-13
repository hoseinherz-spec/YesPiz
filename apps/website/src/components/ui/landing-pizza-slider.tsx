"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/base-ui/carousel";
import { ChevronLeft, ChevronRight } from "@repo/icons";
import { landingImages } from "@/content/images";
import { cn } from "@/lib/utils";

const JUICY_EASE = [0.22, 1, 0.36, 1] as const;

const slideTransition = {
  duration: 1.1,
  ease: JUICY_EASE,
};

const springJuicy = {
  type: "spring" as const,
  stiffness: 90,
  damping: 16,
  mass: 1.1,
};

const ingredientContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.22,
      delayChildren: 0.35,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.14,
      staggerDirection: -1,
    },
  },
};

const ingredientVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    scale: 0.35,
    x: direction * 80,
    y: 40,
    rotate: direction * 25,
    filter: "blur(8px)",
  }),
  visible: () => ({
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    rotate: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1,
      ease: JUICY_EASE,
    },
  }),
  exit: (direction: number) => ({
    opacity: 0,
    scale: 0.5,
    x: direction * -60,
    y: -30,
    rotate: direction * -18,
    filter: "blur(6px)",
    transition: {
      duration: 0.7,
      ease: JUICY_EASE,
    },
  }),
};

type Ingredient = {
  src: string;
  alt: string;
  className: string;
  floatDelay?: number;
  direction?: number;
};

type PizzaSlide = {
  id: string;
  backgroundText: string;
  title: string;
  description: string;
  image: string;
  ingredients: Ingredient[];
};

const pizzaSlides: PizzaSlide[] = [
  {
    id: "pepperoni",
    backgroundText: "PEPPERONI",
    title: "Classic Pepperoni",
    description:
      "Golden crust, melted mozzarella, and generous pepperoni rounds finished with fresh herbs — bold, smoky, and straight from a blazing hot oven.",
    image: landingImages.pizzaPepperoni,
    ingredients: [
      {
        src: landingImages.hero,
        alt: "Fresh tomato",
        className:
          "top-[12%] left-[10%] w-[clamp(3.5rem,8vw,6rem)] rotate-[25deg]",
        floatDelay: 0.2,
        direction: -1,
      },
      {
        src: landingImages.pepperoniClose,
        alt: "Pepperoni slice",
        className:
          "top-[18%] right-[12%] w-[clamp(3rem,7vw,5.5rem)] -rotate-[8deg]",
        floatDelay: 0.8,
        direction: 1,
      },
      {
        src: landingImages.margheritaTray,
        alt: "Fresh herbs",
        className:
          "bottom-[30%] right-[10%] w-[clamp(4rem,9vw,6rem)] -rotate-[15deg]",
        floatDelay: 1.4,
        direction: -1,
      },
    ],
  },
  {
    id: "veggie",
    backgroundText: "VEGGIE",
    title: "Garden Veggie",
    description:
      "Broccoli, tomatoes, bell peppers, olives, and melted cheese on a golden crust — colorful, fresh, and packed with garden flavor in every slice.",
    image: landingImages.pizzaVeggie,
    ingredients: [
      {
        src: landingImages.hero,
        alt: "Tomato slice",
        className:
          "top-[10%] left-[6%] w-[clamp(4rem,10vw,7rem)] -rotate-12",
        floatDelay: 0,
        direction: -1,
      },
      {
        src: landingImages.margheritaDark,
        alt: "Broccoli floret",
        className:
          "top-[14%] right-[8%] w-[clamp(3.5rem,8vw,6rem)] rotate-[18deg]",
        floatDelay: 0.6,
        direction: 1,
      },
      {
        src: landingImages.artisanWood,
        alt: "Bell pepper",
        className:
          "bottom-[32%] right-[6%] w-[clamp(4rem,9vw,6.5rem)] rotate-6",
        floatDelay: 1.2,
        direction: 1,
      },
    ],
  },
  {
    id: "meat-feast",
    backgroundText: "MEAT",
    title: "Ultimate Meat Feast",
    description:
      "Pepperoni, ham, bacon, and roasted chicken over melted mozzarella — a carnivore's dream finished with a flourish of fresh garden herbs.",
    image: landingImages.pizzaMeatFeast,
    ingredients: [
      {
        src: landingImages.pepperoniClose,
        alt: "Pepperoni",
        className:
          "top-[8%] left-[8%] w-[clamp(4rem,9vw,6.5rem)] rotate-[10deg]",
        floatDelay: 0.1,
        direction: -1,
      },
      {
        src: landingImages.margheritaTray,
        alt: "Ham slice",
        className:
          "top-[16%] right-[6%] w-[clamp(3.5rem,8vw,6rem)] -rotate-[20deg]",
        floatDelay: 0.7,
        direction: 1,
      },
      {
        src: landingImages.hero,
        alt: "Fresh herbs",
        className:
          "bottom-[28%] right-[14%] w-[clamp(3rem,7vw,5rem)] rotate-12",
        floatDelay: 1.3,
        direction: 1,
      },
    ],
  },
];

function FloatingIngredient({
  ingredient,
  index,
}: {
  ingredient: Ingredient;
  index: number;
}) {
  const direction = ingredient.direction ?? (index % 2 === 0 ? -1 : 1);

  return (
    <motion.div
      custom={direction}
      variants={ingredientVariants}
      className={cn(
        "pointer-events-none absolute drop-shadow-[0_16px_32px_rgba(34,42,0,0.45)]",
        ingredient.className,
      )}
    >
      <motion.div
        animate={{
          y: [0, -16, 0, 10, 0],
          rotate: [0, direction * 4, 0, direction * -3, 0],
        }}
        transition={{
          duration: 6.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: ingredient.floatDelay ?? index * 0.5,
        }}
      >
        <Image
          src={ingredient.src}
          alt={ingredient.alt}
          width={160}
          height={160}
          className="h-auto w-full object-contain"
          draggable={false}
        />
      </motion.div>
    </motion.div>
  );
}

export function LandingPizzaSlider() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const prevIndexRef = React.useRef(0);

  React.useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const selected = api.selectedScrollSnap();
      const prev = prevIndexRef.current;
      const total = pizzaSlides.length;

      let nextDirection = selected >= prev ? 1 : -1;
      if (prev === total - 1 && selected === 0) nextDirection = 1;
      if (prev === 0 && selected === total - 1) nextDirection = -1;

      setDirection(nextDirection);
      prevIndexRef.current = selected;
      setCurrent(selected);
    };

    onSelect();
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const scrollPrev = React.useCallback(() => {
    setDirection(-1);
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    setDirection(1);
    api?.scrollNext();
  }, [api]);

  const activeSlide = pizzaSlides[current] ?? pizzaSlides[0];

  return (
    <section
      id="menu"
      aria-label="Pizza showcase"
      className="hero-section landing-pizza-slider relative h-dvh w-dvw overflow-hidden font-sans"
    >
      <div className="hero-section__grid pointer-events-none absolute inset-0 z-0" />
      <div className="landing-hero-glow pointer-events-none absolute inset-0 z-0" />

      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "center", duration: 40 }}
        className="relative z-10 h-full w-full"
      >
        <CarouselContent className="ml-0 h-dvh">
          {pizzaSlides.map((slide, index) => (
            <CarouselItem key={slide.id} className="h-dvh basis-full pl-0">
              <div className="relative h-full w-full">
                <AnimatePresence mode="wait">
                  {current === index && (
                    <motion.div
                      key={`bg-${slide.id}`}
                      initial={{ opacity: 0, scale: 0.88, y: 40 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 1.08,
                        y: -30,
                        transition: { duration: 0.9, ease: JUICY_EASE },
                      }}
                      transition={{ ...slideTransition, delay: 0.05 }}
                      className="pointer-events-none absolute inset-0 z-1 flex items-center justify-center select-none"
                      aria-hidden
                    >
                      <span className="hero-display-text whitespace-nowrap text-center text-[clamp(4rem,18vw,14rem)] leading-[0.85] font-black tracking-tighter text-brand-lime uppercase">
                        {slide.backgroundText}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {current === index && (
                    <motion.div
                      key={`ingredients-${slide.id}`}
                      variants={ingredientContainerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute inset-0 z-[2]"
                    >
                      {slide.ingredients.map((ingredient, ingredientIndex) => (
                        <FloatingIngredient
                          key={`${slide.id}-${ingredient.alt}`}
                          ingredient={ingredient}
                          index={ingredientIndex}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                  <AnimatePresence mode="wait" custom={direction}>
                    {current === index && (
                      <motion.div
                        key={`pizza-${slide.id}`}
                        custom={direction}
                        initial={{
                          opacity: 0,
                          scale: 0.65,
                          rotate: direction * -22,
                          y: 60,
                          filter: "blur(12px)",
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          rotate: 0,
                          y: 0,
                          filter: "blur(0px)",
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.75,
                          rotate: direction * 18,
                          y: -40,
                          filter: "blur(10px)",
                          transition: { duration: 0.85, ease: JUICY_EASE },
                        }}
                        transition={springJuicy}
                        className="relative"
                      >
                        <motion.div
                          className="absolute inset-0 scale-125 rounded-full bg-brand-olive/30 blur-3xl"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1.25 }}
                          transition={{
                            duration: 1.2,
                            ease: JUICY_EASE,
                            delay: 0.2,
                          }}
                        />
                        <Image
                          src={slide.image}
                          alt={slide.title}
                          width={640}
                          height={640}
                          priority={index === 0}
                          className="relative h-[clamp(16rem,42vw,28rem)] w-[clamp(16rem,42vw,28rem)] object-contain mix-blend-screen drop-shadow-[0_28px_90px_rgba(34,42,0,0.55)]"
                          draggable={false}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-6 p-6 pb-10 md:p-10 md:pb-14">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeSlide.id}
            custom={direction}
            initial={{
              opacity: 0,
              x: direction * -48,
              y: 32,
              filter: "blur(6px)",
            }}
            animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
            exit={{
              opacity: 0,
              x: direction * 40,
              y: -24,
              filter: "blur(4px)",
              transition: { duration: 0.75, ease: JUICY_EASE },
            }}
            transition={{ duration: 1, ease: JUICY_EASE, delay: 0.15 }}
            className="pointer-events-auto max-w-md"
          >
            <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-brand-lime uppercase">
              From our kitchen
            </p>
            <h2 className="text-2xl font-black tracking-tight text-accent-foreground uppercase md:text-3xl">
              {activeSlide.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-accent-foreground/70 md:text-base">
              {activeSlide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-auto flex shrink-0 items-center gap-3">
          <motion.button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous pizza"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={springJuicy}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-lime/50 bg-brand-olive/20 text-brand-lime backdrop-blur-sm transition-colors hover:border-brand-lime hover:bg-brand-lime hover:text-brand-olive"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <motion.button
            type="button"
            onClick={scrollNext}
            aria-label="Next pizza"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={springJuicy}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-lime/50 bg-brand-olive/20 text-brand-lime backdrop-blur-sm transition-colors hover:border-brand-lime hover:bg-brand-lime hover:text-brand-olive"
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-5"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, color-mix(in oklab, var(--hero-shadow) 55%, transparent) 100%)",
        }}
      />
    </section>
  );
}
