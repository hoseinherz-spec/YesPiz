"use client";
import { AppText } from "@/components/Text";


import Image from "next/image";
import { EnvelopeOpen1, Lock1, UserPlus } from "@repo/icons";
import type { ReactNode } from "react";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import styles from "./AuthScreen.module.css";

/** Authentication-only layout; account editors keep their existing shell. */
export function AuthScreen({
  title,
  backHref,
  children,
  variant = "email",
}: {
  title: string;
  backHref: string;
  children: ReactNode;
  variant?: "welcome" | "signup" | "email" | "password";
}) {
  const Icon =
    variant === "signup"
      ? UserPlus
      : variant === "password"
        ? Lock1
        : EnvelopeOpen1;
  return (
    <AppFrame padded={false}>
      <div
        className={`${styles.screen} ${variant === "welcome" ? styles.welcome : styles.step}`}
      >
        {variant === "welcome" ? (
          <div className={styles.brand}>
            <AppText as="span" className={styles.wordmark}>
              yespiz<AppText as="span">.</AppText>
            </AppText>
            <Image
              src="/images/banners/pizza-editorial-v1.png"
              alt=""
              width={1536}
              height={1024}
              priority
              className={styles.pizza}
            />
          </div>
        ) : null}
        <section className={styles.sheet} aria-label={title}>
          <div className={styles.navigation}>
            <ScreenHeader title={title} backHref={backHref} />
          </div>
          {variant !== "welcome" ? (
            <div className={styles.symbol} aria-hidden="true">
              <Icon size={34} />
            </div>
          ) : null}
          <div className={styles.content}>{children}</div>
        </section>
      </div>
    </AppFrame>
  );
}
