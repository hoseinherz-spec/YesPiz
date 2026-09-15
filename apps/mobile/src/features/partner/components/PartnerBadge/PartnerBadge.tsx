"use client";

import { Chip } from "@heroui/react";
import { MapPin } from "@repo/icons";

import { useApp } from "@/context/AppContext";

import { partnerBadge } from "./PartnerBadge.styles";
import type { PartnerBadgeProps } from "./PartnerBadge.types";

export function PartnerBadge({ compact = false }: PartnerBadgeProps) {
  const { t } = useApp();
  const styles = partnerBadge({ compact });

  return (
    <Chip color="accent" variant="soft" className={styles.root()}>
      <MapPin size={compact ? 12 : 14} color="var(--foreground)" />
      <Chip.Label className={styles.label()}>{t("partner.nearYou")}</Chip.Label>
    </Chip>
  );
}
