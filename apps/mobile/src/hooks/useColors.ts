'use client';

import { useApp } from '@/context/AppContext';

/** Convenience alias for the active palette from AppContext. */
export function useColors() {
  return useApp().colors;
}
