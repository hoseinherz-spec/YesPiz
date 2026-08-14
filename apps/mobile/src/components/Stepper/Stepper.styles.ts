import { tv } from 'tailwind-variants';

export const stepper = tv({
  slots: {
    root: 'inline-flex items-center gap-3',
    decrease:
      'h-9 w-9 min-w-9 rounded-full border border-border bg-card text-lg font-bold text-foreground',
    increase:
      'h-9 w-9 min-w-9 rounded-full bg-accent text-lg font-bold text-accent-foreground',
    value: 'min-w-6 text-center text-[15px] font-bold text-foreground',
  },
});
