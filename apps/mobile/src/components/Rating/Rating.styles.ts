import { tv } from 'tailwind-variants';

export const rating = tv({
  slots: {
    root: 'inline-flex items-center gap-1',
    value: 'text-[13px] font-semibold text-foreground',
    reviews: 'text-[12px] text-muted',
  },
});
