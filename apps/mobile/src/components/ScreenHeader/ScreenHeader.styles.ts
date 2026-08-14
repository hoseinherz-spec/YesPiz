import { tv } from 'tailwind-variants';

import { hx } from '@/lib/heroui-classes';

export const screenHeader = tv({
  slots: {
    root: 'mb-5 flex items-start gap-3',
    back: hx.iconBtn,
    content: 'min-w-0 flex-1 pt-1',
    title: hx.h2,
    subtitle: `${hx.bodySm} mt-0.5`,
  },
});
