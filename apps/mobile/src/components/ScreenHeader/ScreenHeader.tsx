"use client";

import { Button, Typography } from "@heroui/react";
import { ChevronLeft } from "@/components/animated-icon/icons";
import { useRouter } from "next/navigation";

import { screenHeader } from "./ScreenHeader.styles";
import type { ScreenHeaderProps } from "./ScreenHeader.types";
import { ScrollHeader } from "@/components/ScrollHeader";

export function ScreenHeader({
  title,
  subtitle,
  right,
  backHref,
}: ScreenHeaderProps) {
  const router = useRouter();
  const styles = screenHeader();

  return (
    <ScrollHeader className={styles.root()}>
      <Button
        isIconOnly
        variant="secondary"
        aria-label="Back"
        onPress={() => (backHref ? router.push(backHref) : router.back())}
        className={styles.back()}
      >
        <ChevronLeft size={20} />
      </Button>
      <div className={styles.content()}>
        <Typography type="h2" className={styles.title()}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography type="body-sm" className={styles.subtitle()}>
            {subtitle}
          </Typography>
        ) : null}
      </div>
      <div className="flex min-w-0 items-center justify-end">{right}</div>
    </ScrollHeader>
  );
}
