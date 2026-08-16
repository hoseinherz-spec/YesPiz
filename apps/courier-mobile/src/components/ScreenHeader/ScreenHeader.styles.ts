import { tv } from 'tailwind-variants';

import { hx } from '@/lib/heroui-classes';

export const screenHeader = tv({
  slots: {
    root: 'mb-9 grid min-h-16 grid-cols-[64px_1fr_64px] items-center gap-3',
    back: hx.iconBtn,
    content: 'min-w-0 text-center',
    title: 'text-[19px] font-semibold text-foreground',
    subtitle: `${hx.bodySm} mt-1`,
  },
});
