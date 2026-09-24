"use client";

import { Button } from "@heroui/react";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./PizzaDetail.module.css";

export function PizzaDescription({
  text,
  language,
}: {
  text: string;
  language: string;
}) {
  const id = useId();
  const measurement = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const element = measurement.current;
    if (!element) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const lineHeight = Number.parseFloat(
        getComputedStyle(element).lineHeight,
      );
      setOverflows(element.getBoundingClientRect().height > lineHeight * 3 + 1);
    };
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    void document.fonts.ready.then(measure);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [text]);

  return (
    <div className={styles.description}>
      <p
        ref={measurement}
        className={styles.descriptionMeasure}
        aria-hidden="true"
      >
        {text}
      </p>
      <p
        id={id}
        className={`${styles.descriptionText} ${expanded && overflows ? "" : styles.descriptionClamped}`}
      >
        {text}
      </p>
      {overflows && (
        <Button
          variant="ghost"
          className={styles.readMore}
          aria-expanded={expanded}
          aria-controls={id}
          onPress={() => setExpanded((value) => !value)}
        >
          {expanded
            ? language === "de"
              ? "Weniger anzeigen"
              : "See less"
            : language === "de"
              ? "Mehr anzeigen"
              : "See more"}
        </Button>
      )}
    </div>
  );
}
