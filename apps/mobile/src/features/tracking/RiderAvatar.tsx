"use client";
import { useState } from "react";
import { User } from "@/components/animated-icon/icons";
export function RiderAvatar({
  name,
  src,
}: {
  name: string;
  src?: string | null;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <span className="rider-avatar">
      {src && failed !== src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} onError={() => setFailed(src)} />
      ) : (
        <User size={36} aria-hidden="true" />
      )}
    </span>
  );
}
