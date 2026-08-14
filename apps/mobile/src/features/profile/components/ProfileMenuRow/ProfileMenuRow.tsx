'use client';

import { ChevronRight } from '@repo/icons';
import Link from 'next/link';

import type { ProfileMenuRowProps } from './ProfileMenuRow.types';

export function ProfileMenuRow({ icon, label, href, right }: ProfileMenuRowProps) {
  const content = (
    <div className="flex items-center gap-3 rounded-[18px] border border-border bg-card px-3 py-3.5">
      <span className="text-accent">{icon}</span>
      <span className="flex-1 text-[15px] font-semibold text-foreground">{label}</span>
      {right ?? <ChevronRight size={18} color="var(--muted)" />}
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
