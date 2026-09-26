import Image from "next/image";
import { cn } from "@/lib/utils";

type YespizzWordmarkProps = {
  className?: string;
  /** Visual width in CSS; height follows the 3:1 artboard. */
  width?: number;
};

/** Shared vector Yespizz wordmark. */
export function YespizzWordmark({
  className,
  width = 120,
}: YespizzWordmarkProps) {
  const height = Math.round((width * 100) / 300);

  return (
    <Image
      src="/yespizz-wordmark.svg"
      alt="Yespizz"
      width={300}
      height={100}
      className={cn("inline-block h-auto shrink-0", className)}
      style={{ width, height }}
    />
  );
}
