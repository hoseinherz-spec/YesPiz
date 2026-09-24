import type { SavedCard } from "@repo/api";
import styles from "./SavedPaymentCard.module.css";

/** Only masked payment metadata is rendered; never a full card number. */
export function SavedPaymentCard({ card, language = "en" }: {
  card: SavedCard;
  language?: string;
}) {
  return (
    <span className={styles.card}>
      <span className={styles.pattern} aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <span className={styles.brand} data-visa={card.brand.toLowerCase() === "visa" || undefined}>
        {card.brand.replaceAll("_", " ")}
      </span>
      <span className={styles.details}>
        <span className={styles.caption}>{language === "de" ? "Gespeicherte Karte" : "Saved card"}</span>
        <span className={styles.number} aria-label={`${language === "de" ? "Kartennummer endet auf" : "Card ending in"} ${card.last4}`}>
          <span aria-hidden="true">•••• •••• •••• </span>{card.last4}
        </span>
        <span className={styles.expiry}>
          <span>{language === "de" ? "Gültig bis" : "Expiry Date"}</span>
          <strong>{String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)}</strong>
        </span>
      </span>
    </span>
  );
}
