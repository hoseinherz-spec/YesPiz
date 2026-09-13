"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform, useReducedMotion, type MotionValue } from "motion/react";
import useMeasure from "react-use-measure";
import { AppText } from "@/components/Text";
import { cn } from "@/lib/cn";

const TRANSITION = { type: "spring" as const, stiffness: 280, damping: 18, mass: 0.3 };

function Digit({ value }: { value: number }) {
  const animatedValue = useSpring(value, TRANSITION);
  const [ref, bounds] = useMeasure();
  useEffect(() => { animatedValue.set(value); }, [animatedValue, value]);
  return (
    <span className="relative inline-block w-[1ch] overflow-x-visible overflow-y-clip leading-none tabular-nums">
      <span ref={ref} className={bounds.height ? "invisible block" : "block"}>{value}</span>
      {bounds.height > 0 && Array.from({ length: 10 }, (_, number) => (
        <DigitGlyph key={number} mv={animatedValue} number={number} height={bounds.height} />
      ))}
    </span>
  );
}

function DigitGlyph({ mv, number, height }: { mv: MotionValue<number>; number: number; height: number }) {
  const y = useTransform(mv, (latest) => {
    const offset = (10 + number - (latest % 10)) % 10;
    return (offset > 5 ? offset - 10 : offset) * height;
  });
  return <motion.span style={{ y }} className="absolute inset-0 flex items-center justify-center" transition={TRANSITION}>{number}</motion.span>;
}

export type SlidingNumberProps = {
  value: number;
  padStart?: boolean;
  decimalSeparator?: string;
  locale?: string;
  format?: Intl.NumberFormatOptions;
  suffix?: string;
  className?: string;
};

/** The supplied spring digit wheel, with inline semantics and localized currency support. */
export function SlidingNumber({ value, padStart = false, decimalSeparator, locale = "en-US", format, suffix = "", className }: SlidingNumberProps) {
  const reducedMotion = useReducedMotion();
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    useGrouping: false,
    ...format,
    ...(padStart ? { minimumIntegerDigits: 2 } : {}),
  });
  const parts = formatter.formatToParts(value).map((part) => ({
    ...part,
    value: part.type === "decimal" && decimalSeparator !== undefined ? decimalSeparator : part.value,
  }));
  const label = parts.map((part) => part.value).join("") + suffix;
  const integerLength = parts.filter((part) => part.type === "integer").reduce((sum, part) => sum + part.value.length, 0);
  let integerIndex = 0;
  let fractionIndex = 0;
  return (
    <AppText as="span" className={cn("inline-flex items-baseline whitespace-nowrap tabular-nums", className)}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="inline-flex items-center">
        {reducedMotion ? label : <>
          {parts.flatMap((part, partIndex) => {
            if (part.type !== "integer" && part.type !== "fraction") return <span key={`separator-${part.type}-${partIndex}`}>{part.value}</span>;
            return [...part.value].map((digit) => {
              const key = part.type === "integer" ? `integer-${integerLength - ++integerIndex}` : `fraction-${fractionIndex++}`;
              return <Digit key={key} value={Number(digit)} />;
            });
          })}
          {suffix}
        </>}
      </span>
    </AppText>
  );
}
