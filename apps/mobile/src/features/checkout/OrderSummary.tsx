"use client";

import { ShoppingBag } from "@/components/animated-icon/icons";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useApp } from "@/context/AppContext";
import styles from "./checkout.module.css";

export function OrderSummary({
  subtotal,
  discount,
  deliveryFee,
  total,
  count,
}: {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  count?: number;
}) {
  const { t, language } = useApp();
  return (
    <section className={styles.summary} aria-label={t("payment.summary")}>
      <div className={styles.heading}>
        <ShoppingBag size={18} aria-hidden="true" />
        <h2>{t("payment.summary")}</h2>
        {count !== undefined && (
          <strong>
            {count}{" "}
            {language === "de" ? "Artikel" : count === 1 ? "item" : "items"}
          </strong>
        )}
      </div>
      <dl className={styles.rows}>
        <div>
          <dt>{t("common.subtotal")}</dt>
          <dd>
            <AnimatedNumber currency value={subtotal} />
          </dd>
        </div>
        {discount > 0 && (
          <div>
            <dt>{t("common.discount")}</dt>
            <dd>
              <AnimatedNumber currency value={discount ? -discount : 0} />
            </dd>
          </div>
        )}
        {deliveryFee > 0 && (<div>
          <dt>{t("common.delivery")}</dt>
          <dd>
            <AnimatedNumber currency value={deliveryFee} />
          </dd>
        </div>)}
        <div>
          <dt>{t("common.total")}</dt>
          <dd>
            <AnimatedNumber currency value={total} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function OrderTotal({ total }: { total: number }) {
  const { t } = useApp();
  return (
    <div className={styles.total}>
      <span>{t("common.total")}</span>
      <strong>
        <AnimatedNumber currency value={total} />
      </strong>
    </div>
  );
}
