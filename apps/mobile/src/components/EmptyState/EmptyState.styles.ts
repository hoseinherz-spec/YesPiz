import { tv } from "tailwind-variants";

import { hx } from "@/lib/heroui-classes";

export const emptyState = tv({
  slots: {
    root: "flex flex-1 flex-col items-center justify-center px-4 py-12 text-center",
    iconWrap:
      "empty-state-icon flex size-16 items-center justify-center rounded-[22px] text-accent",
    title: hx.h3,
    body: `${hx.bodySm} mt-3 max-w-[28ch] text-pretty leading-6`,
    actionWrap: "mt-6 w-full max-w-xs",
    action: hx.btnPrimary,
  },
});
