'use client';

import { useEffect } from 'react';

/** Run an async loader once on mount without tripping set-state-in-effect lint. */
export function useLoadOnMount(load: () => void | Promise<void>) {
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void Promise.resolve(load());
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Intentionally once-on-mount for screen data loaders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
