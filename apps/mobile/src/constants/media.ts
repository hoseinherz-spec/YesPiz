export type ProductMedia = {
  imageUrl?: string | null;
  image: string;
};

export type ResolvedImageSource = string;

/** Resolve one of the bundled PizzaCraft illustrations without leaking URL encoding into screens. */
export function pizzaCraftAsset(name: string): string {
  return `/images/pizzacraft/${encodeURIComponent(name)}.png`;
}

/** The bundled catalog photographs have transparent, web-optimized cutouts. */
export function resolvePizzaCutout(src: string): string {
  const match = /^\/images\/pizza-(margherita|pepperoni|salami|bbq-chicken|quattro-formaggi|diavola|tonno|vegetariana|funghi|yespiz-special)\.png$/.exec(src);
  return match ? `/images/pizza-cutouts/${match[1]}.webp` : src;
}

/** Resolve the display source for any product (admin URL → local fallback). */
export function resolveProductImage(media: ProductMedia): ResolvedImageSource {
  const url = media.imageUrl?.trim();
  return resolvePizzaCutout(url || media.image);
}
