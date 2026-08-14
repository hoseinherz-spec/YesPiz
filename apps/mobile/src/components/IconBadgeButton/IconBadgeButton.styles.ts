import { tv } from 'tailwind-variants';

import { hx } from '@/lib/heroui-classes';

export const iconBadgeButton = tv({
  slots: {
    control: hx.iconBtn,
    badge: 'bg-accent font-bold text-accent-foreground',
  },
});
