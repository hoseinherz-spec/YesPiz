'use client';
import { AppText } from "@/components/Text";


import { ChevronRight } from '@repo/icons';
import Link from 'next/link';

import type { ProfileMenuRowProps } from './ProfileMenuRow.types';

export function ProfileMenuRow({ icon, label, href, right }: ProfileMenuRowProps) {
  const content = (
    <div className="flex items-center gap-3 rounded-[18px] border border-border bg-card px-3 py-3.5">
      <AppText as="span" className="text-accent">{icon}</AppText>
      <AppText as="span" className="flex-1 text-[15px] font-semibold text-foreground">{label}</AppText>
      {right ?? <ChevronRight size={18} color="var(--muted)" />}
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
