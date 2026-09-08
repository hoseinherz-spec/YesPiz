"use client";
import { useEffect, useRef } from "react";
export function QrCode({ value }: { value: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then((qr) => {
      if (!cancelled && canvas.current)
        return qr.toCanvas(canvas.current, value, { width: 180, margin: 2 });
    });
    return () => {
      cancelled = true;
    };
  }, [value]);
  return (
    <canvas ref={canvas} aria-label="Scan this code with the courier app" />
  );
}
