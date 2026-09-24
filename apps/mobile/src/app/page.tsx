"use client";
import { BrandLogo } from "@/components/BrandLogo";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import styles from "./onboarding/onboarding.module.css";

export default function SplashPage() {
  const router = useRouter();
  const { hydrated, onboarded } = useApp();
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(
      () => {
        router.replace(onboarded ? "/home/" : "/onboarding/");
      },
      onboarded ? 1150 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [hydrated, onboarded, router]);
  return (
    <main className={styles.root}>
      <div className={styles.app}>
        <div className={styles.splash}>
          <BrandLogo className="brand-logo-splash" />
        </div>
      </div>
    </main>
  );
}
