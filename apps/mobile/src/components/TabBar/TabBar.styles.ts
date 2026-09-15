import { tv } from "tailwind-variants";

export const tabBar = tv({
  slots: {
    fade: "pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto h-28 max-w-[473px] bg-gradient-to-t from-background to-transparent",
    nav: "pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-[473px] items-center justify-center gap-2 px-3 pb-[env(safe-area-inset-bottom)]",
    pill: "pointer-events-auto flex items-center gap-0.5 rounded-[40px] border border-border p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
    tab: "flex min-w-12 flex-col items-center justify-center gap-1 rounded-[28px] px-2 py-2 transition",
    label: "text-[12px] leading-[15px] font-medium",
  },
  variants: {
    focused: {
      true: {
        label: "text-white",
      },
      false: {
        label: "text-[var(--nav-muted)]",
      },
    },
  },
});
