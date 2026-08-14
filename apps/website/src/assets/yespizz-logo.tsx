import { YespizzWordmark } from "@/assets/yespizz-wordmark";
import { cn } from "@/lib/utils";

type YespizzLogoProps = {
  className?: string;
  width?: number;
  height?: number;
};

/** Brand logo — uses the shared wordmark asset. */
export function YespizzLogo({
  className,
  width = 164,
  height,
}: YespizzLogoProps) {
  const resolvedWidth =
    height != null ? Math.round((height * 300) / 100) : width;

  return (
    <YespizzWordmark
      width={resolvedWidth}
      className={cn(className)}
    />
  );
}
