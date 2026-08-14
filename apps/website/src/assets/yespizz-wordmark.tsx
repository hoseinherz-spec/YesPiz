import { cn } from "@/lib/utils";

type YespizzWordmarkProps = {
  className?: string;
  /** Visual width in CSS; height follows the 3:1 artboard. */
  width?: number;
};

/**
 * Brand wordmark from /yespizz-wordmark.png (black art, transparent counters),
 * tinted brand lime via alpha mask so letter holes stay open.
 */
export function YespizzWordmark({
  className,
  width = 120,
}: YespizzWordmarkProps) {
  const height = Math.round((width * 100) / 300);

  return (
    <span
      role="img"
      aria-label="Yespizz"
      className={cn("inline-block shrink-0 bg-brand-lime", className)}
      style={{
        width,
        height,
        WebkitMaskImage: "url(/yespizz-wordmark.png)",
        maskImage: "url(/yespizz-wordmark.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        maskMode: "alpha",
      }}
    />
  );
}
