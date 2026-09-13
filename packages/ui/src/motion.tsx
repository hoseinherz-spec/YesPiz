"use client";

import { useEffect, useState } from "react";
import { useReducedMotion, type Transition } from "motion/react";

/** CSS tokens are the source of truth for both Motion and native transitions. */
export function useAppMotion(): Transition {
  const reducedMotion = useReducedMotion();
  const [duration, setDuration] = useState(0.22);
  useEffect(() => {
    const token = getComputedStyle(document.documentElement).getPropertyValue(
      "--app-motion-control",
    );
    const milliseconds = Number.parseFloat(token);
    if (Number.isFinite(milliseconds)) setDuration(milliseconds / 1000);
  }, [reducedMotion]);
  return {
    type: "tween",
    duration: reducedMotion ? 0 : duration,
    ease: [0.22, 1, 0.36, 1],
  };
}
