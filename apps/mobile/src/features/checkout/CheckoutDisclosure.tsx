"use client";

import { useId, useState, type ReactNode } from "react";
import "@/features/profile/components/profile-motion.css";
import styles from "./checkout.module.css";

/** Reuses the installed transitions.dev accordion, including reduced motion. */
export function CheckoutDisclosure({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <section className={`t-acc ${styles.disclosure}`} data-open={String(open)}>
      <button
        type="button"
        className={`t-acc-head ${styles.disclosureTrigger}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <span className="t-acc-chevron" aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
          >
            <path d="M4 6.5L8 10.5L12 6.5" />
          </svg>
        </span>
      </button>
      <div className="t-acc-panel" id={id} inert={!open} aria-hidden={!open}>
        <div className="t-acc-panel-inner">
          <div className={styles.disclosureBody}>{children}</div>
        </div>
      </div>
    </section>
  );
}
