import { tv } from 'tailwind-variants';

import { hx } from '@/lib/heroui-classes';

export const emptyState = tv({
  slots: {
    root: 'flex flex-1 flex-col items-center justify-center px-6 py-16 text-center',
    iconWrap: 'mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-card text-muted',
    title: hx.h3,
    body: `${hx.bodySm} mt-2 max-w-xs`,
    actionWrap: 'mt-6 w-full max-w-xs',
    action: hx.btnPrimary,
  },
});
