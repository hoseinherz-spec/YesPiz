import { tv } from 'tailwind-variants';

export const partnerBadge = tv({
  slots: {
    root: 'rounded-full border border-[color-mix(in_oklab,var(--accent)_35%,transparent)] bg-[color-mix(in_oklab,var(--background)_55%,transparent)]',
    label: 'font-semibold text-accent',
  },
  variants: {
    compact: {
      true: {
        root: 'px-2 py-1',
        label: 'text-[10px]',
      },
      false: {
        root: 'px-3 py-1.5',
        label: 'text-[11px]',
      },
    },
  },
  defaultVariants: {
    compact: false,
  },
});
