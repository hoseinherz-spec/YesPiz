"use client";
import Link from "next/link";
import { ChevronLeft } from "@/components/animated-icon/icons";
import { BrandLogo } from "@/components/BrandLogo";
import {
  KeyRound,
  LogIn,
  MailCheck,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

export function AuthPage({
  title,
  description,
  backHref = "/auth/sign-in/",
  backLabel = "Back to sign in",
  children,
  footer,
  afterAction,
  social,
}: {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  afterAction?: ReactNode;
  social?: ReactNode;
}) {
  return (
    <main className={styles.shell}>
      <section className={styles.screen} aria-label={title}>
        <header className={styles.toolbar}>
          <Link href={backHref} aria-label={backLabel} className={styles.back}>
            <ChevronLeft size={24} />
          </Link>
          <BrandLogo className={styles.brandLogo} />
        </header>
        <div className={styles.content}>
          <span className={styles.titleIcon} aria-hidden="true">
            <AuthTitleIcon title={title} />
          </span>
          <h1>{title}</h1>
          <p className={styles.subtitle}>{description}</p>
          <div className={styles.authBody}>{children}</div>
          {footer && <div className={styles.action}>{footer}</div>}
          {afterAction}
        </div>
        {social && <footer className={styles.footer}>{social}</footer>}
      </section>
    </main>
  );
}

function AuthTitleIcon({ title }: { title: string }) {
  const normalized = title.toLowerCase();
  if (normalized.includes("log in") || normalized.includes("sign in"))
    return <LogIn />;
  if (normalized.includes("sign up")) return <UserPlus />;
  if (normalized.includes("verification")) return <ShieldCheck />;
  if (normalized.includes("email")) return <MailCheck />;
  return <KeyRound />;
}
