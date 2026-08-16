import { tv } from 'tailwind-variants';

export const tabBar = tv({
  slots: {
    fade: 'pointer-events-none absolute inset-x-0 bottom-0 z-40 h-32 bg-gradient-to-t from-black to-transparent',
    nav: 'pointer-events-none absolute inset-x-0 bottom-4 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]',
    pill: 'pointer-events-auto flex items-center gap-0.5 rounded-[40px] border border-border p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.22)]',
    tab: 'flex min-w-16 flex-col items-center justify-center gap-1 rounded-[28px] px-3.5 py-2 transition',
    label: 'text-[12px] leading-[15px] font-medium',
  },
  variants: {
    focused: {
      true: {
        tab: 'bg-accent',
        label: 'text-accent-foreground',
      },
      false: {
        label: 'text-muted',
      },
    },
  },
});
