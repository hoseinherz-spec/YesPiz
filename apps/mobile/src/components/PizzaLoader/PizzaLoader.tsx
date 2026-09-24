import type { CSSProperties } from "react";
import styles from "./PizzaLoader.module.css";

type PizzaLoaderProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  showLabel?: boolean;
  className?: string;
};

/** Six copies of the artwork's intact 60° slice assemble into a whole pizza. */
export function PizzaLoader({
  size = "md",
  label = "Loading…",
  showLabel = false,
  className = "",
}: PizzaLoaderProps) {
  return (
    <span
      className={`${styles.loader} ${styles[size]} ${className}`}
      role="status"
      aria-label={label}
    >
      <span className={styles.pizza} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className={styles.slot}
            style={{ "--slice-index": index } as CSSProperties}
          >
            {/* The alpha-transparent source is shared by all six slices and cached once. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.slice}
              src="/images/pizza-loader-source.png"
              alt=""
              width={3000}
              height={3000}
              draggable={false}
            />
          </span>
        ))}
      </span>
      {showLabel && (
        <span className={styles.label} aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}
