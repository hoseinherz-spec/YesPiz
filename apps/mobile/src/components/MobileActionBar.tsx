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
        <ExpandingArrowButton
          className="w-full"
          disabled={isDisabled}
          isLoading={isPending}
          onClick={submit}
        >
          {label}
        </ExpandingArrowButton>
      ) : (
        <Button
          variant="primary"
          fullWidth
          onPress={submit}
          isDisabled={isDisabled}
          isPending={isPending}
          className="h-[56px] justify-center rounded-full bg-accent px-4 text-[15px] font-semibold text-accent-foreground shadow-none"
        >
          <AppText
            as="span"
            className="flex size-6 shrink-0 items-center justify-center"
          >
            {icon}
          </AppText>
          <AppText
            as="span"
            className="min-w-0 flex-1 whitespace-normal px-2 text-center text-[14px] leading-tight min-[430px]:text-[16px]"
          >
            {label}
          </AppText>
        </Button>
      )}
    </div>
  );
}
