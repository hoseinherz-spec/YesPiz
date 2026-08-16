'use client';

import { Pizza } from '@repo/icons';
import { useState } from 'react';

import { cn } from '@/lib/cn';

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function ProductImage({
  src,
  alt,
  className,
  fallbackClassName,
}: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;

  if (failed || !src) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn(
          'flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_55%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_64%)] text-accent',
          fallbackClassName,
        )}
      >
        <Pizza size={72} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
