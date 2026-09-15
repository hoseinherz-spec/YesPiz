import { tv } from "tailwind-variants";

export const productCard = tv({
  slots: {
    card: "relative w-full min-w-0 gap-0 overflow-hidden border-0 bg-surface p-0 shadow-[var(--reference-shadow)] ring-0 transition-colors hover:border-accent/40",
    hitArea:
      "absolute inset-0 z-[2] rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
    imageWrap:
      "pointer-events-none relative overflow-hidden bg-surface-secondary",
    image: "h-full w-full object-contain p-1",
    favorite:
      "pointer-events-auto absolute z-10 size-11 min-w-11 rounded-full border border-white/15 bg-background/80 text-foreground backdrop-blur-md",
    content: "pointer-events-none relative min-w-0",
    title: "font-bold leading-tight tracking-tight text-foreground",
    subtitle: "text-muted",
    price:
      "tabular-nums whitespace-nowrap font-bold tracking-tight text-accent",
    addButton:
      "flex shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground",
    meta: "text-xs text-muted",
  },
  variants: {
    variant: {
      grid: {
        card: "rounded-[22px]",
        imageWrap: "aspect-square w-full",
        favorite: "right-2 top-2",
        content: "flex flex-1 flex-col gap-2 p-3.5",
        title: "min-h-[2.5em] line-clamp-2 text-base",
        subtitle: "line-clamp-1 text-xs leading-5",
        price: "text-base",
        addButton: "size-9",
      },
      row: {
        card: "rounded-[22px]",
        imageWrap:
          "w-[112px] self-stretch shrink-0 flex items-center justify-center",
        favorite: "left-2 top-2",
        content: "flex min-h-[136px] w-full flex-row gap-0 p-0",
        title: "line-clamp-2 text-base",
        subtitle: "mt-1 line-clamp-2 text-xs leading-5",
        price: "text-base",
        addButton: "size-9",
      },
    },
  },
  defaultVariants: { variant: "grid" },
});
