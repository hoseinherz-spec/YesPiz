/**
 * YesPiz 3.0 — dark / neon design tokens.
 * Values resolve from HeroUI CSS theme variables (globals.css).
 */
export const brand = {
  neon: 'var(--accent)',
  navy: 'var(--background)',
  lime: 'var(--accent)',
  purple: 'var(--background)',
  olive: 'var(--background)',
  black: 'var(--background)',
  white: 'var(--foreground)',
} as const;

/** Palette reads live CSS vars so light/dark switches without JS color tables. */
export const palettes = {
  dark: {
    bg: 'var(--background)',
    surface: 'var(--surface)',
    card: 'var(--card)',
    cardElevated: 'var(--card-elevated)',
    border: 'var(--border)',
    text: 'var(--foreground)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--muted)',
    primary: 'var(--accent)',
    onPrimary: 'var(--accent-foreground)',
    accent: 'var(--accent)',
    onAccent: 'var(--accent-foreground)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    error: 'var(--danger)',
    overlay: 'color-mix(in oklab, var(--background) 62%, transparent)',
    glass: 'color-mix(in oklab, var(--foreground) 7%, transparent)',
  },
  light: {
    bg: 'var(--background)',
    surface: 'var(--surface)',
    card: 'var(--card)',
    cardElevated: 'var(--card-elevated)',
    border: 'var(--border)',
    text: 'var(--foreground)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--muted)',
    primary: 'var(--accent)',
    onPrimary: 'var(--accent-foreground)',
    accent: 'var(--background)',
    onAccent: 'var(--foreground)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    error: 'var(--danger)',
    overlay: 'color-mix(in oklab, var(--background) 45%, transparent)',
    glass: 'color-mix(in oklab, var(--background) 4%, transparent)',
  },
};

export type Palette = (typeof palettes)['dark'];

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const APP_MAX_WIDTH = 430;
