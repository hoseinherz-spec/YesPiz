"use client";
import { AppText } from "@/components/Text";


import { buttonVariants, Typography } from "@heroui/react";
import { ArrowRight } from "@/components/animated-icon/icons";
import Link from "next/link";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";

import { cn } from "@/lib/cn";

import { emptyState } from "./EmptyState.styles";
import type { EmptyStateProps } from "./EmptyState.types";

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionHref,
  image,
}: EmptyStateProps) {
  const styles = emptyState();

  return (
    <div className={styles.root()}>
      <div className="empty-state-scene" aria-hidden="true">
        <div className="empty-state-orbit" />
        <div className="empty-state-preview">
          <span />
          <span />
          <span />
        </div>
        {image ? (
          <ProductImage src={image} alt="" className="empty-state-image" />
        ) : null}
        <div className={styles.iconWrap()}>{icon}</div>
      </div>
      <Typography type="h3" className={styles.title()}>
        {title}
      </Typography>
      <Typography type="body-sm" className={styles.body()}>
        {body}
      </Typography>
      {actionLabel && actionHref ? (
        <div className={styles.actionWrap()}>
          <Link
            href={actionHref}
            className={cn(
              buttonVariants({ variant: "primary", fullWidth: true }),
              styles.action(),
            )}
          >
            <AppText as="span">{actionLabel}</AppText>
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
