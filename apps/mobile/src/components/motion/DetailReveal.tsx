"use client";

import { ViewTransition, type ReactNode } from "react";

/** Snapshot reveals overlap the hero flight; live content is always readable. */
export function DetailReveal({
  children,
  step,
}: {
  children: ReactNode;
  step: number;
}) {
  return (
    <ViewTransition
      default="none"
      enter={`food-detail-reveal food-detail-${Math.min(step, 7)}`}
      exit="food-leave"
    >
      {children}
    </ViewTransition>
  );
}
