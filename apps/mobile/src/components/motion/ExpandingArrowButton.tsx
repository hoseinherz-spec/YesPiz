"use client";
// Adapted from the supplied beui.dev expanding-arrow-button.
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight, ShoppingBag } from "@/components/animated-icon/icons";
import { EASE_OUT, SPRING_LAYOUT, SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/cn";

export interface ExpandingArrowButtonProps extends Omit<
  HTMLMotionProps<"button">,
  "children"
> {
  children: ReactNode;
  isLoading?: boolean;
  accentClassName?: string;
  labelClassName?: string;
}
const ARROW_OPACITY = [1, 0.55, 0.24] as const;
export const ExpandingArrowButton = forwardRef<
  HTMLButtonElement,
  ExpandingArrowButtonProps
>(function ExpandingArrowButton(
  {
    children,
    className,
    accentClassName,
    labelClassName,
    disabled,
    isLoading = false,
    onClick,
    ...rest
  },
  ref,
) {
  const reduce = useReducedMotion();
  const [clicked, setClicked] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = clicked || isLoading;
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled || active}
      aria-busy={active || undefined}
      onClick={(event) => {
        if (disabled || active) return;
        setClicked(true);
        resetTimer.current = setTimeout(() => setClicked(false), 650);
        onClick?.(event);
      }}
      whileTap={reduce || disabled ? undefined : { scale: 0.97 }}
      transition={SPRING_PRESS}
      className={cn(
        "relative inline-flex h-[76px] min-w-0 items-center overflow-hidden rounded-full bg-accent p-2 text-accent-foreground shadow-[0_12px_30px_color-mix(in_oklab,var(--accent)_18%,transparent)] select-none outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none",
        disabled && !active && "opacity-50",
        className,
      )}
      {...rest}
    >
      <motion.span
        layout="size"
        aria-hidden="true"
        transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
        style={{ width: active ? "calc(100% - 16px)" : 60, borderRadius: 999 }}
        className={cn(
          "absolute inset-y-2 left-2 z-10 overflow-hidden bg-accent-foreground text-accent",
          accentClassName,
        )}
      >
        <motion.span
          animate={{ opacity: active ? 0 : 1, scale: active ? 0.72 : 1 }}
          transition={{ duration: reduce ? 0 : 0.14, ease: EASE_OUT }}
          className="absolute inset-0 grid place-items-center"
        >
          <ShoppingBag
            size={27}
            color="currentColor"
            secondaryColor="currentColor"
          />
        </motion.span>
        <span className="absolute inset-0 flex items-center justify-around px-5">
          {ARROW_OPACITY.map((opacity, index) => (
            <motion.span
              key={opacity}
              animate={{
                opacity: active ? opacity : 0,
                x: active && !reduce ? 0 : -8,
              }}
              transition={{
                duration: reduce ? 0 : 0.18,
                delay: active && !reduce ? 0.04 + index * 0.04 : 0,
                ease: EASE_OUT,
              }}
              className="inline-grid place-items-center"
            >
              <ChevronRight size={31} color="currentColor" />
            </motion.span>
          ))}
        </span>
      </motion.span>
      <motion.span
        aria-hidden="true"
        animate={{ opacity: active ? 0 : 1, x: active && !reduce ? 8 : 0 }}
        transition={{ duration: reduce ? 0 : 0.12, ease: EASE_OUT }}
        className="ml-[72px] flex shrink-0 items-center -space-x-2 text-accent-foreground"
      >
        {ARROW_OPACITY.map((opacity) => (
          <ChevronRight
            key={opacity}
            size={25}
            color="currentColor"
            style={{ opacity }}
          />
        ))}
      </motion.span>
      <motion.span
        animate={{ opacity: active ? 0 : 1, x: active && !reduce ? 8 : 0 }}
        transition={{ duration: reduce ? 0 : 0.12, ease: EASE_OUT }}
        className={cn(
          "relative z-0 mr-3 ml-3 flex min-w-0 flex-1 items-center justify-center text-[17px] font-extrabold tracking-[-0.025em]",
          labelClassName,
        )}
      >
        {children}
      </motion.span>
    </motion.button>
  );
});
