"use client";

// Adapted from Motion Primitives' Animated Background (MIT).
// See THIRD-PARTY-NOTICES.md. Selection stays controlled by the app/router.
import { motion, useReducedMotion } from "motion/react";
import {
  Children,
  cloneElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
import { useAppMotion } from "./motion";

type Item = { "data-id": string; children?: ReactNode; className?: string };

export function AnimatedBackground({
  children,
  value,
}: {
  children: ReactElement<Item>[];
  value: string | null;
}) {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const transition = useAppMotion();

  return Children.map(children, (child) =>
    cloneElement(
      child,
      {
        className: `${child.props.className ?? ""} app-selection-item`,
      },
      <>
        {child.props["data-id"] === value && (
          <motion.span
            aria-hidden="true"
            className="app-selection-background"
            layoutId={reducedMotion ? undefined : `selection-${id}`}
            initial={false}
            transition={transition}
          />
        )}
        <span className="app-selection-content">{child.props.children}</span>
      </>,
    ),
  );
}
