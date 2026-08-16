'use client';

import { Button } from '@heroui/react';
import { ShoppingBag } from '@repo/icons';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

type MobileActionBarProps = {
  label: ReactNode;
  onPress?: () => void;
  href?: string;
  icon?: ReactNode;
  leading?: ReactNode;
  isDisabled?: boolean;
  isPending?: boolean;
  className?: string;
};

export function MobileActionBar({
  label,
  onPress,
  href,
  icon = <ShoppingBag size={20} />,
  leading,
  isDisabled,
  isPending,
  className,
}: MobileActionBarProps) {
  const router = useRouter();

  return (
    <div className={cn(hx.bottomBar, className)}>
      {leading}
      <Button
        variant="primary"
        fullWidth
        onPress={() => {
          onPress?.();
          if (href) router.push(href);
        }}
        isDisabled={isDisabled}
        isPending={isPending}
        className="h-[76px] justify-start rounded-full bg-surface-secondary p-2 text-[18px] font-bold text-surface-secondary-foreground shadow-none"
      >
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </span>
        <span aria-hidden="true" className="ml-1 tracking-[-2px] text-muted">
          〉〉〉
        </span>
        <span className="flex-1 pr-5 text-center">{label}</span>
      </Button>
    </div>
  );
}
