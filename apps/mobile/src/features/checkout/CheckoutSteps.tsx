"use client";

import Link from "next/link";
import { useApp } from "@/context/AppContext";
import styles from "./checkout.module.css";

export function CheckoutSteps({ step }: { step: "delivery" | "payment" }) {
  const { language } = useApp();
  const de = language === "de";
  return (
    <nav aria-label={de ? "Bestellschritte" : "Checkout steps"}>
      <ol className={styles.steps}>
        <li aria-current={step === "delivery" ? "step" : undefined}>
          {step === "payment" ? (
            <Link href="/checkout/">
              <span aria-hidden="true">✓</span>
              {de ? "Lieferung" : "Delivery"}
            </Link>
          ) : (
            <>
              <span aria-hidden="true">1</span>
              {de ? "Lieferung" : "Delivery"}
            </>
          )}
        </li>
        <li aria-current={step === "payment" ? "step" : undefined}>
          <span aria-hidden="true">2</span>
          {de ? "Zahlung" : "Payment"}
        </li>
      </ol>
    </nav>
  );
}
