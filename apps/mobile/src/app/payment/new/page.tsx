"use client";

import { Button, Typography } from "@heroui/react";
import { CreditCard } from "@/components/animated-icon/icons";
import { useRouter } from "next/navigation";

import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";
import { PageIntro } from "@/components/PageIntro";

export default function NewPaymentCardPage() {
  const router = useRouter();
  const { t } = useApp();

  return (
    <AppFrame className="reference-screen">
      <ScreenHeader title={t("payment.card")} backHref="/checkout/" />

      <PageIntro
        icon={<CreditCard />}
        title={t("payment.stripeTitle")}
        description={t("payment.stripeBody")}
      />

      <Typography
        type="body-sm"
        className={cn(
          hx.bodySm,
          "rounded-[26px] bg-surface-secondary p-5 text-center leading-6",
        )}
      >
        {t("payment.stripeDisclosure")}
      </Typography>

      <Button
        variant="primary"
        fullWidth
        onPress={() => router.replace("/payment/")}
        className={cn(hx.btnPrimary, "mt-7")}
      >
        {t("checkout.continuePayment")}
      </Button>
    </AppFrame>
  );
}
