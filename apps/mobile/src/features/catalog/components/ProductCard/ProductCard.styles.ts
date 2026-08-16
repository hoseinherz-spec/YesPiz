import { tv } from 'tailwind-variants';

export const productCard = tv({
  slots: {
    card: 'relative w-full border-0 bg-card shadow-none ring-0',
    hitArea:
      'absolute inset-0 z-0 h-full w-full rounded-[28px] bg-transparent p-0 shadow-none',
    imageWrap: 'relative overflow-hidden bg-surface pointer-events-none',
    image: 'h-full w-full object-contain transition-transform duration-500',
    favorite:
      'pointer-events-auto absolute z-10 rounded-full bg-[color-mix(in_oklab,var(--background)_72%,transparent)] backdrop-blur-md',
    content: 'relative z-[1] pointer-events-none',
    title: 'font-semibold text-foreground',
    subtitle: 'text-muted',
    price: 'font-bold text-foreground',
    addButton:
      'flex items-center justify-center rounded-full bg-accent text-accent-foreground ring-4 ring-background',
    meta: 'text-[12px] text-muted',
  },
  variants: {
    variant: {
      grid: {
        card: 'overflow-visible rounded-[28px] transition active:scale-[0.98]',
        imageWrap: 'aspect-[1/1.02] rounded-t-[28px]',
        image: 'p-1.5',
        favorite: 'top-2 right-2 h-8 w-8 min-w-8',
        content: 'flex min-h-[94px] flex-1 flex-col gap-1 p-3 pt-2',
        title: 'line-clamp-1 text-[clamp(14px,4.4vw,17px)] font-semibold',
        price: 'text-[clamp(15px,4.8vw,19px)]',
        addButton: 'absolute -right-1.5 -bottom-1.5 h-9 w-9',
      },
      row: {
        card: 'rounded-[28px] p-3 transition active:scale-[0.99]',
        imageWrap: 'h-[108px] w-[108px] shrink-0 rounded-[22px]',
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
