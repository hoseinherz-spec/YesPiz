import { tv } from 'tailwind-variants';

import { hx } from '@/lib/heroui-classes';

export const screenHeader = tv({
  slots: {
    root: 'mb-6 grid min-h-12 grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-3',
    back: hx.iconBtn,
    content: 'min-w-0 text-center',
    title: 'text-center text-[18px] leading-tight font-semibold tracking-[-0.025em] text-foreground',
    subtitle: `${hx.bodySm} mt-1 text-center`,
  },
});
