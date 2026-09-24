"use client";
import type { CustomerOrderView } from "@repo/api";
import { Check, X } from "@/components/animated-icon/icons";
import { useApp } from "@/context/AppContext";
import { OrderSummary } from "./OrderSummary";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";
import { pizzaCraftAsset } from "@/constants/media";
import styles from "./checkout.module.css";

export function OrderReceipt({
  order,
  failed = false,
  message,
}: {
  order: CustomerOrderView;
  failed?: boolean;
  message?: string;
}) {
  const { t, language } = useApp();
  return (
    <div>
      <div
        className={`${styles.result} ${failed ? styles.failure : ""}`}
        role="status"
      >
        <div className={styles.receipt} aria-hidden="true">
          <ProductImage
            src={pizzaCraftAsset("Digital Food Receipt")}
            alt=""
            className={styles.receiptArtwork}
          />
          <span>{failed ? <X size={30} /> : <Check size={30} />}</span>
        </div>
        <h1>
          {failed
            ? language === "de"
              ? "Deine Zahlung wurde nicht abgeschlossen."
              : "Your payment has not been completed."
            : t("success.title")}
        </h1>
        {message && <p>{message}</p>}
      </div>
      <section className={styles.summary}>
        <dl className={styles.rows}>
          <div>
            <dt>
              {language === "de" ? "Bestellnummer" : "Order tracking code"}
            </dt>
            <dd>{order.id}</dd>
          </div>
          {order.createdAt && (
            <div>
              <dt>{language === "de" ? "Bestelldatum" : "Order date"}</dt>
              <dd>
                {new Date(order.createdAt).toLocaleDateString(
                  language === "de" ? "de-DE" : "en-GB",
                )}
              </dd>
            </div>
          )}
        </dl>
      </section>
      <OrderSummary
        subtotal={order.subtotalCents / 100}
        discount={(order.discountCents ?? 0) / 100}
        deliveryFee={order.deliveryFeeCents / 100}
        total={order.totalCents / 100}
      />
    </div>
  );
}
