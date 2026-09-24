import { cn } from "@/lib/cn";

/** Shared YesPiz styles on top of HeroUI primitives (theme vars). */
export const hx = {
  display:
    "text-[42px] leading-[1.08] font-extrabold tracking-[-0.035em] text-foreground",
  h1: "text-[34px] leading-[1.12] font-extrabold tracking-[-0.03em] text-foreground",
  h2: "text-[26px] leading-[1.18] font-bold tracking-[-0.02em] text-foreground",
  h3: "text-[21px] leading-[1.24] font-bold tracking-[-0.015em] text-foreground",
  title: "text-[17px] leading-[1.35] font-semibold text-foreground",
  body: "text-[15px] leading-[1.5] font-normal text-foreground",
  bodySm: "text-[13px] leading-[1.45] font-normal text-muted",
  caption: "text-[12px] leading-[1.4] font-medium text-muted",
  label:
    "text-[11px] leading-[1.3] font-semibold uppercase tracking-wide text-muted",

  card: "rounded-[30px] border border-border bg-card p-4 shadow-none ring-0",
  cardElevated:
    "rounded-[30px] border border-border bg-card-elevated p-4 shadow-none ring-0",

  btnPrimary: cn(
    "h-[56px] w-full gap-2 rounded-full px-6 text-[15px] font-semibold",
    "bg-accent text-accent-foreground shadow-none",
  ),
  btnSecondary: cn(
    "h-[56px] w-full gap-2 rounded-full px-6 text-[15px] font-semibold",
    "border border-border bg-card text-foreground",
  ),
  btnGhost: cn(
    "h-[56px] w-full gap-2 rounded-full px-6 text-[15px] font-semibold",
    "bg-transparent text-foreground shadow-none",
  ),
  btnDanger: cn(
    "h-[64px] w-full gap-2 rounded-full px-6 text-[17px] font-bold",
    "bg-danger-soft text-danger shadow-none",
  ),
  iconBtn:
    "relative size-12 min-w-0 shrink-0 aspect-square rounded-full p-0 border-0 bg-card text-foreground shadow-none",
  field:
    "h-[52px] w-full rounded-[18px] border border-transparent bg-field-background px-6 text-[16px] font-medium text-field-foreground shadow-none outline-none placeholder:text-field-placeholder focus-visible:border-focus",
  sheet:
    "rounded-t-[44px] bg-surface px-[16px] pt-9 pb-[max(28px,env(safe-area-inset-bottom))] text-surface-foreground",
  bottomBar:
    "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[473px] items-center gap-3 rounded-t-[26px] reference-action-bar bg-surface px-[16px] pt-4 pb-[max(18px,env(safe-area-inset-bottom))]",
  filterChip: (active: boolean) =>
    cn(
      "h-14 shrink-0 rounded-full px-5 text-[15px] font-semibold shadow-none",
      active
        ? "bg-accent text-accent-foreground"
        : "border border-border bg-card text-text-secondary",
    ),
} as const;
