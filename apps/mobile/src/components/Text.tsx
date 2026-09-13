"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextElement =
  "p" | "span" | "strong" | "small" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/** Semantic copy that does not consume a parent field's description slot. */
export function AppText({
  as: Tag = "span",
  className,
  children,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, "color"> & { as?: TextElement }) {
  return (
    <Tag {...props} className={cn("app-text", className)}>
      {children}
    </Tag>
  );
}
