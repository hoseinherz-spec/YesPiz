"use client";
import { AdaptiveStepper } from "@/components/motion/AdaptiveStepper";
import type { StepperProps } from "./Stepper.types";
export function Stepper({ value, onChange, min = 1, max, disabled }: StepperProps) {
  return <AdaptiveStepper value={value} onValueChange={onChange} min={min} max={max} disabled={disabled} />;
}
