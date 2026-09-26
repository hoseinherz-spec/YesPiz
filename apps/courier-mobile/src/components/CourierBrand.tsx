import Image from "next/image";

import { cn } from "@/lib/cn";

export function CourierBrand({ className }: { className?: string }) {
  return (
    <div className={cn("courier-brand", className)}>
      <Image
        src="/yespizz-wordmark.svg"
        alt="Yespizz"
        width={150}
        height={50}
        priority
      />
      <span className="courier-role">Courier</span>
    </div>
  );
}
