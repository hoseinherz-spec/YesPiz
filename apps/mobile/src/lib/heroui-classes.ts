import { cn } from '@/lib/cn';

/** Shared YesPiz styles on top of HeroUI primitives (theme vars). */
export const hx = {
  display: 'text-[40px] leading-[1.1] font-extrabold text-foreground',
  h1: 'text-[32px] leading-[1.15] font-bold text-foreground',
  h2: 'text-[24px] leading-[1.2] font-bold text-foreground',
  h3: 'text-[20px] leading-[1.25] font-semibold text-foreground',
  title: 'text-[16px] leading-[1.35] font-semibold text-foreground',
  body: 'text-[15px] leading-[1.45] font-normal text-foreground',
  bodySm: 'text-[13px] leading-[1.4] font-normal text-muted',
  caption: 'text-[12px] leading-[1.35] font-medium text-muted',
  label: 'text-[11px] leading-[1.3] font-semibold uppercase tracking-wide text-muted',

  card: 'rounded-[24px] border border-border bg-card p-4 shadow-none ring-0',
  cardElevated:
    'rounded-[24px] border bg-card-elevated p-4 shadow-[0px_0px_24px_rgba(216,255,0,0.12)] ring-0 [border-color:color-mix(in_oklab,var(--accent)_18%,transparent)]',

  btnPrimary: cn(
    'h-14 w-full gap-2 rounded-full px-5 text-[15px] font-extrabold uppercase tracking-wide',
    'bg-accent text-accent-foreground shadow-[0_8px_24px_rgba(216,255,0,0.28)]',
  ),
  btnSecondary: cn(
    'h-14 w-full gap-2 rounded-full px-5 text-[15px] font-extrabold uppercase tracking-wide',
    'border border-border bg-card text-foreground',
  ),
  btnGhost: cn(
    'h-14 w-full gap-2 rounded-full px-5 text-[15px] font-extrabold uppercase tracking-wide',
    'bg-transparent text-foreground shadow-none',
  ),
  btnDanger: cn(
    'h-14 w-full gap-2 rounded-full px-5 text-[15px] font-extrabold uppercase tracking-wide',
    'bg-danger-soft text-danger shadow-none',
  ),
  iconBtn:
    'relative h-11 w-11 min-w-11 rounded-full border border-border bg-card text-foreground',
  filterChip: (active: boolean) =>
    cn(
      'h-auto shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold',
      active
        ? 'bg-accent text-accent-foreground shadow-[0_4px_16px_rgba(216,255,0,0.25)]'
        : 'border border-border bg-card text-text-secondary',
    ),
} as const;
