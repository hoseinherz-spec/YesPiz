export type ProductMedia = {
  imageUrl?: string | null;
  image: string;
};

export type ResolvedImageSource = string;

/** Resolve the display source for any product (admin URL → local fallback). */
export function resolveProductImage(media: ProductMedia): ResolvedImageSource {
  const url = media.imageUrl?.trim();
  if (url) return url;
  return media.image;
}
