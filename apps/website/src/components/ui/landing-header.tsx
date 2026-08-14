"use client";

import { buttonVariants, Link, Typography } from "@heroui/react";
import { motion } from "motion/react";
import { ArrowRight } from "@repo/icons";
import { YespizzWordmark } from "@/assets/yespizz-wordmark";
import { cn } from "@/lib/utils";

export function LandingHeader() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5"
    >
      <div className="pointer-events-auto mx-auto flex max-w-[1440px] items-center justify-between gap-3 rounded-2xl bg-black px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] md:rounded-3xl md:gap-4 md:px-6 md:py-3">
        <Link
          href="/"
          aria-label="Yespizz home"
          className="inline-flex items-center transition-opacity duration-200 hover:opacity-90"
        >
          <YespizzWordmark width={112} />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="#menu"
            className="hidden rounded-full px-4 py-2 text-xs font-black text-white uppercase no-underline transition-colors hover:text-brand-lime sm:inline-flex sm:text-sm"
          >
            Our pizzas
          </Link>

          <motion.a
            href="#craft"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              buttonVariants({ variant: "primary" }),
              "group inline-flex h-auto shrink-0 items-center gap-2 rounded-full bg-brand-lime py-0.5 pr-1 pl-4 shadow-lg transition-[box-shadow] duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_0_20px_color-mix(in_oklab,var(--color-brand-lime)_35%,transparent)] sm:pl-5",
            )}
          >
            <Typography
              type="body-xs"
              className="text-xs font-black text-brand-olive uppercase sm:text-sm"
            >
              The craft
            </Typography>
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-purple sm:size-10">
              <ArrowRight className="size-3.5 text-accent-foreground transition-transform duration-200 group-hover:translate-x-0.5 sm:size-4" />
            </span>
          </motion.a>
        </div>
      </div>
    </motion.header>
  );
}
