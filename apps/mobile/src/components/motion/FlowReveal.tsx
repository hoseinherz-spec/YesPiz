"use client";

import { ViewTransition, type ReactNode } from "react";
import { DetailReveal } from "./DetailReveal";

/** Independent snapshots let content arrive after the shared product image. */
export function FlowReveal({
  children,
  step = 0,
  variant = "flow",
}: {
  children: ReactNode;
  step?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  variant?: "flow" | "detail";
}) {
  if (variant === "detail")
    return <DetailReveal step={step}>{children}</DetailReveal>;
  return (
    <ViewTransition
      default="none"
      enter={`food-reveal food-reveal-${Math.min(step, 4)}`}
      exit="food-leave"
    >
      {children}
    </ViewTransition>
  );
}
