import type { ReactNode } from "react";
import { Reveal } from "@repo/ui/reveal";
import styles from "./PageIntro.module.css";

/** Quiet, centered introduction matching the sign-in screens. */
export function PageIntro({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Reveal className={styles.intro}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <h1 className="t-stagger-line">{title}</h1>
      {description ? <p className="t-stagger-line t-stagger-line--2">{description}</p> : null}
    </Reveal>
  );
}
