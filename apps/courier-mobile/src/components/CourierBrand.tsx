import { Bike } from "lucide-react";

import { cn } from "@/lib/cn";

export function CourierBrand({ className }: { className?: string }) {
  return (
    <div className={cn("courier-brand", className)} aria-label="YesPiz Courier">
      <span className="courier-brand__mark" aria-hidden="true">
        <Bike size={21} strokeWidth={2.4} />
      </span>
      <span>YESPIZ</span>
      <span className="courier-role">Courier</span>
    </div>
  );
}
