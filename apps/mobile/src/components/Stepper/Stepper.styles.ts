import { tv } from "tailwind-variants";

export const stepper = tv({
  slots: {
    root: "inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background/50 p-1",
    decrease:
      "h-10 w-10 min-w-10 rounded-full border-0 bg-transparent text-lg font-medium text-foreground",
    increase:
      "h-10 w-10 min-w-10 rounded-full bg-surface-tertiary text-lg font-medium text-foreground",
    value:
      "min-w-6 text-center text-[15px] font-semibold tabular-nums text-foreground",
  },
});
