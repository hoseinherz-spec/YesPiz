"use client";
import { Button } from "@heroui/react";
import { useId, useState } from "react";
import styles from "./Profile.module.css";
import "./profile-motion.css";

export function ProfileFaq({
  question,
  answer,
  initiallyOpen = false,
}: {
  question: string;
  answer: string;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const id = useId();
  return (
    <div className={`t-acc ${styles.card}`} data-open={String(open)}>
      <Button
        variant="ghost"
        className="t-acc-head flex h-auto min-h-10 w-full justify-between gap-4 rounded-none px-0 text-left whitespace-normal font-semibold"
        aria-expanded={open}
        aria-controls={id}
        onPress={() => setOpen((value) => !value)}
      >
        {question}
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
      </Button>
      <div className="t-acc-panel" id={id} inert={!open}>
        <div className="t-acc-panel-inner">
          <p className="mt-3 border-t border-border pt-4 pb-1 text-sm leading-6">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
