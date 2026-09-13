"use client";
// Adapted from the supplied beui.dev expanding-arrow-button.
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { EASE_OUT, SPRING_LAYOUT, SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/cn";

export interface ExpandingArrowButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  isLoading?: boolean;
  accentClassName?: string;
  labelClassName?: string;
}
const ARROW_OPACITY = [1, 0.78, 0.54, 0.32, 0.16] as const;
function DottedChevron() {
  return <svg viewBox="0 0 20 28" fill="none" aria-hidden="true" className="h-7 w-5">
    {[[4,4],[10,9],[16,14],[10,19],[4,24]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill="currentColor" />)}
  </svg>;
}
export const ExpandingArrowButton = forwardRef<HTMLButtonElement, ExpandingArrowButtonProps>(function ExpandingArrowButton({ children, className, accentClassName, labelClassName, disabled, isLoading = false, onClick, ...rest }, ref) {
  const reduce = useReducedMotion();
  const [clicked, setClicked] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = clicked || isLoading;
  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);
  return <motion.button ref={ref} type="button" disabled={disabled || active}
    aria-busy={active || undefined}
    onClick={(event) => {
      if (disabled || active) return;
      setClicked(true);
      resetTimer.current = setTimeout(() => setClicked(false), 650);
      onClick?.(event);
    }}
    whileTap={reduce || disabled ? undefined : { scale: 0.97 }} transition={SPRING_PRESS}
    className={cn("relative inline-flex h-16 min-w-0 items-center overflow-hidden rounded-[22px] bg-neutral-950 p-1.5 text-white select-none outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none", disabled && !active && "opacity-50", className)} {...rest}>
    <motion.span layout="size" aria-hidden="true" transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
      style={{ width: active ? "calc(100% - 12px)" : 52, borderRadius: 16 }}
      className={cn("absolute inset-y-1.5 left-1.5 z-10 overflow-hidden bg-accent text-accent-foreground", accentClassName)}>
      <motion.span animate={{ opacity: active ? 0 : 1 }} transition={{ duration: reduce ? 0 : 0.1, ease: EASE_OUT }} className="absolute inset-0 grid place-items-center"><DottedChevron /></motion.span>
      <span className="absolute inset-0 flex items-center justify-around px-3">
        {ARROW_OPACITY.map((opacity, index) => <motion.span key={opacity}
          animate={{ opacity: active ? opacity : 0, x: active && !reduce ? 0 : -6 }}
          transition={{ duration: reduce ? 0 : 0.18, delay: active && !reduce ? 0.04 + index * 0.025 : 0, ease: EASE_OUT }} className="inline-grid place-items-center"><DottedChevron /></motion.span>)}
      </span>
    </motion.span>
    <motion.span animate={{ opacity: active ? 0 : 1, x: active && !reduce ? 6 : 0 }} transition={{ duration: reduce ? 0 : 0.12, ease: EASE_OUT }} className={cn("relative z-0 ml-[64px] mr-2 flex-1 text-base font-medium tracking-[-0.02em]", labelClassName)}>{children}</motion.span>
  </motion.button>;
});
