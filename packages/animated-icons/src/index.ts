/**
 * Names are derived from the original files in the User Interface Icon Pack V2.
 * Every source animation is copied to each Capacitor web bundle by `sync-assets`.
 */
/**
 * A normalized source file name (for example `home-icon`), or a semantic alias
 * from `animatedIconAliases`.
 */
export type AnimatedIconName = string;

const aliases = {
  back: "back",
  bell: "bell-icon",
  check: "checked-icon",
  close: "close-icon",
  code: "keyboard-icon-01",
  face: "favorite-icon",
  home: "home-icon",
  key: "key-icon",
  mail: "feedback-icon",
  phone: "charging-plug-icon",
  photo: "glass-icon",
} as const;

export type AnimatedIconAlias = keyof typeof aliases;

/** Returns a public URL for a packaged Lottie animation. */
export function animatedIconPath(name: AnimatedIconName): string {
  const assetName = aliases[name as AnimatedIconAlias] ?? name;
  return `/icons/ui-animated/${assetName}.json`;
}

export const animatedIconAliases = aliases;
