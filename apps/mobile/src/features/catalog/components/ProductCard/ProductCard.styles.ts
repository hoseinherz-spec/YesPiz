import { tv } from 'tailwind-variants';

export const productCard = tv({
  slots: {
    card: 'relative w-full border border-border bg-card shadow-none ring-0',
    hitArea:
      'absolute inset-0 z-0 h-full w-full rounded-[24px] bg-transparent p-0 shadow-none',
    imageWrap: 'relative overflow-hidden bg-surface pointer-events-none',
    image: 'h-full w-full object-contain transition-transform duration-500',
    favorite:
      'pointer-events-auto absolute rounded-full bg-[color-mix(in_oklab,var(--background)_55%,transparent)]',
    content: 'relative z-[1] pointer-events-none',
    title: 'font-semibold text-foreground',
    subtitle: 'text-muted',
    price: 'font-bold text-accent',
    addButton: 'flex items-center justify-center rounded-full bg-accent text-accent-foreground',
    meta: 'text-[12px] text-muted',
  },
  variants: {
    variant: {
      grid: {
        card: 'overflow-hidden rounded-[24px] transition active:scale-[0.98]',
        imageWrap: 'aspect-square',
        image: 'p-3',
        favorite: 'top-2.5 right-2.5 h-8 w-8 min-w-8',
        content: 'flex flex-1 flex-col gap-2 p-3',
        title: 'line-clamp-1 text-[16px]',
        price: 'text-[14px]',
        addButton: 'h-7 w-7',
      },
      row: {
        card: 'rounded-[24px] p-3 transition active:scale-[0.99]',
        imageWrap: 'h-[100px] w-[100px] shrink-0 rounded-[18px]',
        image: 'p-1',
        favorite: 'top-2 right-2 h-8 w-8 min-w-8',
        content: 'flex w-full flex-row gap-3 p-0',
        title: 'truncate text-[16px]',
        subtitle: 'mt-0.5 line-clamp-1 text-[13px]',
        price: 'text-[15px]',
        addButton: 'h-8 w-8',
      },
    },
    spinning: {
      true: {
        image: 'scale-150 rotate-[360deg]',
      },
    },
  },
  defaultVariants: {
    variant: 'grid',
  },
});
