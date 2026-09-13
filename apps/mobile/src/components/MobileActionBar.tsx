"use client";
import { ExpandingArrowButton } from "@/components/motion/ExpandingArrowButton";
import { AppText } from "@/components/Text";


import { useFormAction } from "@repo/ui/forms";
import { Button } from "@heroui/react";
import { ShoppingBag } from "@repo/icons";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

type MobileActionBarProps = {
  label: ReactNode;
  expandingArrow?: boolean;
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
  expandingArrow = false,
  onPress,
  href,
  icon = <ShoppingBag size={20} />,
  leading,
  isDisabled,
  isPending,
  className,
}: MobileActionBarProps) {
  const router = useRouter();
  const submit = useFormAction(() => {
    onPress?.();
    if (href) router.push(href);
  });

  return (
    <div className={cn(hx.bottomBar, className)}>
      {leading}
      {expandingArrow ? (
        <ExpandingArrowButton className="w-full" disabled={isDisabled} isLoading={isPending} onClick={submit}>
          {label}
        </ExpandingArrowButton>
      ) : <Button
        variant="primary"
        fullWidth
        onPress={submit}
        isDisabled={isDisabled}
        isPending={isPending}
        className="h-[76px] justify-start rounded-full bg-surface-secondary p-2 text-[18px] font-bold text-surface-secondary-foreground shadow-none"
      >
        <AppText as="span" className="flex size-12 min-[430px]:size-16 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </AppText>
        <AppText as="span"
          aria-hidden="true"
          className="ml-1 hidden min-[430px]:block tracking-[-2px] text-muted"
        >
          〉〉〉
        </AppText>
        <AppText as="span" className="min-w-0 flex-1 whitespace-normal px-2 text-center text-[14px] leading-tight min-[430px]:text-[16px]">
          {label}
        </AppText>
      </Button>}
    </div>
  );
}
