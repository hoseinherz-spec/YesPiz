import { tv } from "tailwind-variants";

import { hx } from "@/lib/heroui-classes";

export const screenHeader = tv({
  slots: {
    root: "mb-5 grid min-h-12 grid-cols-[48px_1fr_auto] items-center gap-3",
    back: hx.iconBtn,
    content: "min-w-0 text-left",
    title: "text-[19px] font-semibold text-foreground",
    subtitle: `${hx.bodySm} mt-1`,
  },
});
