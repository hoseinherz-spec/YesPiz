import { tv } from "tailwind-variants";

export const tabBar = tv({
  slots: {
    fade: "bottom-nav-backdrop pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[473px]",
    nav: "pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-[473px] items-center justify-center px-3 pb-[env(safe-area-inset-bottom)]",
    pill: "bottom-nav-pill pointer-events-auto flex items-center gap-2 rounded-[30px] p-2",
    tab: "flex h-[52px] w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-[20px] py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--selection)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--nav-background)]",
    label: "!text-[12px] !leading-4 font-semibold",
  },
  variants: {
    focused: {
      true: { label: "text-white" },
      false: { label: "text-[var(--nav-muted)]" },
    },
  },
});
