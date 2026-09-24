"use client";
// Adapted from the supplied beui.dev adaptive-stepper; keeps the shared sliding digits.
import { motion, useReducedMotion } from "motion/react";
import { useId, useRef } from "react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/cn";
import { Button } from "@heroui/react";

const MotionButton = motion.create(Button);

export interface AdaptiveStepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}
export function AdaptiveStepper({ value, onValueChange, min = 1, max = Infinity, step = 1, disabled = false, className, "aria-label": label = "Quantity" }: AdaptiveStepperProps) {
  const reduce = useReducedMotion();
  const filterId = `stepper-${useId().replace(/:/g, "")}`;
  const decrementRef = useRef<HTMLButtonElement>(null);
  const incrementRef = useRef<HTMLButtonElement>(null);
  const lower = Number.isFinite(min) ? min : 1;
  const upper = max === Infinity ? Infinity : Math.max(lower, Number.isFinite(max) ? max : lower);
  const stride = Number.isFinite(step) && step > 0 ? step : 1;
  const current = Math.min(upper, Math.max(lower, Number.isFinite(value) ? value : lower));
  const atMin = current <= lower;
  const atMax = current >= upper;
  const valueGeometry = atMin && atMax ? { x: 0, width: 216 } : atMin ? { x: 0, width: 152 } : atMax ? { x: 64, width: 152 } : { x: 64, width: 88 };
  const shapes = [{ x: atMin ? 32 : 0, width: 48 }, valueGeometry, { x: atMax ? 136 : 168, width: 48 }];
  const transition = reduce ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1.3, 0.71, 1] as const };
  function change(direction: -1 | 1, keyboard: boolean) {
    if (disabled || (direction === -1 ? atMin : atMax)) return;
    const index = direction === 1 ? Math.floor((current - lower) / stride + 1e-10) + 1 : Math.ceil((current - lower) / stride - 1e-10) - 1;
    const next = Math.min(upper, Math.max(lower, Number((lower + index * stride).toFixed(10))));
    onValueChange(next);
    if (keyboard) requestAnimationFrame(() => {
      if (next === upper) decrementRef.current?.focus();
      else if (next === lower) incrementRef.current?.focus();
    });
  }
  return <fieldset disabled={disabled} className={cn("relative isolate m-0 inline-block h-12 w-[216px] shrink-0 border-0 p-0", disabled && "opacity-50", className)}>
    <legend className="sr-only">{label}</legend>
    <svg width="0" height="0" aria-hidden="true" className="absolute"><defs><filter id={filterId} x="-25%" y="-100%" width="150%" height="300%" colorInterpolationFilters="sRGB"><feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" /><feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" /></filter></defs></svg>
    <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ filter: `url(#${filterId})` }}>
      {shapes.map((shape, index) => <motion.span key={index} initial={false} animate={shape} transition={transition} className="absolute left-0 top-0 h-12 rounded-full bg-background" />)}
    </span>
    {([-1, 1] as const).map((direction) => {
      const hidden = direction === -1 ? atMin : atMax;
      return <MotionButton isIconOnly variant="ghost" key={direction} ref={direction === -1 ? decrementRef : incrementRef} type="button" aria-label={direction === -1 ? "Decrease" : "Increase"} aria-hidden={hidden || undefined} isDisabled={disabled || hidden}
        initial={false} animate={{ x: direction === -1 ? (hidden ? 32 : 0) : (hidden ? 136 : 168), opacity: hidden ? 0 : 1 }} transition={transition}
        whileTap={reduce || disabled || hidden ? undefined : { scale: 0.94 }}
        onPress={(event) => change(direction, event.pointerType === "keyboard")}
        className="absolute left-0 top-0 z-10 grid size-12 place-items-center rounded-full text-foreground outline-none hover:bg-muted/15 focus-visible:ring-2 focus-visible:ring-foreground disabled:pointer-events-none">
        <motion.span aria-hidden="true" transition={SPRING_PRESS} className="text-xl font-semibold">{direction === -1 ? "−" : "+"}</motion.span>
      </MotionButton>;
    })}
    <motion.output initial={false} animate={valueGeometry} transition={transition} aria-live="polite" aria-atomic="true" className="absolute left-0 top-0 flex h-12 items-center justify-center overflow-hidden rounded-full px-4 text-lg font-semibold text-foreground">
      <AnimatedNumber value={current} />
    </motion.output>
  </fieldset>;
}
