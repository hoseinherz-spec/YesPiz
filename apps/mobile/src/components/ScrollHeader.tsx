"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./ScrollHeader.module.css";

/** A viewport-pinned header with home-style scroll direction and fading blur. */
export function ScrollHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  const slot = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLElement>(null);
  const [frame, setFrame] = useState<{left: number; top: number; width: number; height: number} | null>(null);
  const [hidden, setHidden] = useState(false);
  const mounted = frame !== null;
  useEffect(() => {
    const measure = () => {
      const rect = slot.current?.getBoundingClientRect();
      if (rect) setFrame({ left: rect.left, top: 0, width: rect.width, height: content.current?.offsetHeight || 72 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (slot.current) observer.observe(slot.current);
    let previous = window.scrollY;
    const scroll = () => {
      const next = window.scrollY;
      measure();
      if (Math.abs(next - previous) < 6 && next > 72) return;
      setHidden(next > previous && next > 72);
      previous = next;
    };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', measure); };
  }, []);
  useEffect(() => {
    if (!content.current) return;
    const observer = new ResizeObserver(() => {
      const height = content.current?.offsetHeight;
      if (height) setFrame(old => old && old.height !== height ? {...old, height} : old);
    });
    observer.observe(content.current);
    return () => observer.disconnect();
  }, [mounted]);
  const header = <header ref={content} className={`${styles.header} ${className}`} data-hidden={hidden || undefined} onFocusCapture={() => setHidden(false)} style={frame ? { position: 'fixed', left: frame.left, width: frame.width, top: frame.top } : undefined}>{children}</header>;
  return <div ref={slot} style={frame ? { height: frame.height } : undefined}>{frame ? createPortal(header, document.body) : header}</div>;
}
