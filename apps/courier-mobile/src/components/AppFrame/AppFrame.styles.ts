import { tv } from 'tailwind-variants';

export const appFrame = tv({
  slots: {
    root: 'relative min-h-dvh w-full bg-background',
    shell: 'relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip bg-background',
    main: 'flex flex-1 flex-col',
  },
  variants: {
    padded: {
      true: {
        main: 'px-[16px] pt-[max(24px,env(safe-area-inset-top))]',
      },
    },
    withTabs: {
      true: {
        main: 'pb-28',
      },
    },
  },
});
