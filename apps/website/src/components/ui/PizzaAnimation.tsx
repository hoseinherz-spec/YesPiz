"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/** Frame files on disk: frame_0000.jpg … frame_0143.jpg (144 total). */
const FRAME_COUNT = 144;
const FRAME_START = 0;
const FRAME_PAD = 4;
const FRAME_BASE = "/assets/pizza-animation";

/**
 * Scroll knobs:
 * - `SCRUB` — soft lag on scroll (Apple-style)
 * - `SCROLL_HEIGHT_VH` — taller = slower overall sequence
 */
const SCRUB = 1.15;
/**
 * Top offset so the frame clears the fixed floating header
 * (header pt + bar height ≈ 96–112px).
 */
/** Side / bottom gap from viewport edges (px). */
const FRAME_INSET = 40;
/**
 * Top offset so the frame clears the fixed floating header
 * (header pt + bar height ≈ 96–112px).
 */
const FRAME_TOP = 112;
/** Corner radius of the masked frame (px). */
const FRAME_RADIUS = 40;

function frameSrc(index: number) {
  const n = String(FRAME_START + index).padStart(FRAME_PAD, "0");
  return `${FRAME_BASE}/frame_${n}.jpg`;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap,
  canvas: HTMLCanvasElement,
  radiusDevicePx: number,
) {
  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.width;
  const ih = img.height;
  if (!iw || !ih || !cw || !ch) return;

  const scale = Math.max(cw / iw, ch / ih);
  const tw = iw * scale;
  const th = ih * scale;
  const ox = (cw - tw) / 2;
  const oy = (ch - th) / 2;

  ctx.save();
  ctx.clearRect(0, 0, cw, ch);
  roundedRectPath(ctx, 0, 0, cw, ch, radiusDevicePx);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, ox, oy, tw, th);
  ctx.restore();
}

async function preloadFrames(
  onProgress: (loaded: number, total: number) => void,
  signal: AbortSignal,
  staticOnly: boolean,
): Promise<ImageBitmap[]> {
  const count = staticOnly ? 1 : FRAME_COUNT;
  const images: ImageBitmap[] = new Array(count);
  const width = window.matchMedia("(max-width: 767px)").matches ? 640 : 960;
  let next = 0;
  let loaded = 0;
  let failure: unknown;
  // Limit concurrent downloads/decodes; keep resized bitmaps, not full HD images.
  await Promise.all(
    Array.from({ length: Math.min(4, count) }, async () => {
      try {
        while (next < count && !signal.aborted && !failure) {
          const index = next++;
          const response = await fetch(frameSrc(index), { signal });
          if (!response.ok) throw new Error("Could not load pizza animation");
          const bitmap = await createImageBitmap(await response.blob(), {
            resizeWidth: width,
            resizeQuality: "high",
          });
          images[index] = bitmap;
          if (!signal.aborted) onProgress(++loaded, count);
        }
      } catch (error) {
        failure = error;
      }
    }),
  );
  if (signal.aborted || failure) {
    images.forEach((image) => image.close());
    throw failure ?? new DOMException("Aborted", "AbortError");
  }
  return images;
}

type PizzaAnimationProps = {
  className?: string;
  eyebrow?: string;
  headline?: string;
  description?: string;
};

/**
 * Scroll story:
 * 1) Frame enters fullscreen
 * 2) Frame shrinks to the left (40px radius mask)
 * 3) Black copy fades in on the right
 * Parallel: image sequence scrubs with scroll
 */
export function PizzaAnimation({
  className,
  eyebrow = "From the oven",
  headline = "Craft you can taste.",
  description = "Watch Neapolitan pizza leave the fire and settle into the box — dough, heat, and Vienna soul in every frame.",
}: PizzaAnimationProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaColRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const copyColRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<ImageBitmap[]>([]);
  const frameIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const needsDrawRef = useRef(true);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dprRef = useRef(1);
  const radiusProgressRef = useRef(1);
  const resizeRafRef = useRef<number | null>(null);
  const [staticOnly, setStaticOnly] = useState(false);
  const [hasSequence, setHasSequence] = useState(true);

  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const progressLabel = useMemo(
    () => `${Math.min(100, Math.round(loadProgress * 100))}%`,
    [loadProgress],
  );

  const scheduleDraw = useCallback(() => {
    needsDrawRef.current = true;
    if (rafRef.current != null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!needsDrawRef.current) return;
      needsDrawRef.current = false;

      const canvas = canvasRef.current;
      const frames = framesRef.current;
      if (!canvas || frames.length === 0) return;

      const ctx =
        ctxRef.current ??
        canvas.getContext("2d", { alpha: true, desynchronized: true });
      if (!ctx) return;
      ctxRef.current = ctx;

      const idx = Math.max(
        0,
        Math.min(frames.length - 1, frameIndexRef.current),
      );
      const img = frames[idx];
      if (!img) return;

      const radius = FRAME_RADIUS * dprRef.current * radiusProgressRef.current;
      drawFrame(ctx, img, canvas, radius);
    });
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    if (!canvas || !frame) return;

    const dpr = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
    dprRef.current = dpr;
    const { clientWidth: w, clientHeight: h } = frame;
    if (w < 2 || h < 2) return;

    const nextW = Math.round(w * dpr);
    const nextH = Math.round(h * dpr);
    if (canvas.width !== nextW || canvas.height !== nextH) {
      canvas.width = nextW;
      canvas.height = nextH;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctxRef.current = null;
    }

    scheduleDraw();
  }, [scheduleDraw]);

  useEffect(() => {
    const controller = new AbortController();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setStaticOnly(motion.matches);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        preloadFrames(
          (loaded, total) => {
            setLoadProgress(loaded / total);
          },
          controller.signal,
          motion.matches,
        )
          .then((frames) => {
            if (controller.signal.aborted) {
              frames.forEach((frame) => frame.close());
              return;
            }
            framesRef.current = frames;
            setHasSequence(frames.length > 1);
            setReady(true);
          })
          .catch((error: Error) => {
            if (!controller.signal.aborted) {
              setLoadError(error.message);
              setReady(true);
            }
          });
      },
      { rootMargin: "600px" },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      observer.disconnect();
      controller.abort();
      motion.removeEventListener("change", updateMotion);
      framesRef.current.forEach((frame) => frame.close());
      framesRef.current = [];
    };
  }, []);

  // ResizeObserver batches geometry changes after layout, instead of forcing
  // synchronous layout twice per GSAP update.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(() => {
      if (resizeRafRef.current !== null) return;
      resizeRafRef.current = requestAnimationFrame(() => {
        resizeRafRef.current = null;
        resizeCanvas();
      });
    });
    observer.observe(frame);
    return () => {
      observer.disconnect();
      if (resizeRafRef.current !== null)
        cancelAnimationFrame(resizeRafRef.current);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    if (!ready) return;
    resizeCanvas();
    scheduleDraw();

    const onResize = () => {
      resizeCanvas();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [ready, resizeCanvas, scheduleDraw]);

  useEffect(() => {
    if (!ready) return;
    ScrollTrigger.refresh();
  }, [ready, staticOnly, hasSequence]);

  useGSAP(
    () => {
      if (!ready) return;

      const section = sectionRef.current;
      const mediaCol = mediaColRef.current;
      const frame = frameRef.current;
      const copyCol = copyColRef.current;
      if (!section || !mediaCol || !frame || !copyCol) return;

      const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

      const frameState = { frame: 0 };

      // Start: near-fullscreen under the header, rounded from the start
      gsap.set(mediaCol, { width: "100%", height: "100%" });
      gsap.set(frame, {
        top: FRAME_TOP,
        left: FRAME_INSET,
        right: FRAME_INSET,
        bottom: FRAME_INSET,
        borderRadius: FRAME_RADIUS,
      });
      gsap.set(copyCol, {
        autoAlpha: 0,
        x: isMobile() ? 0 : 48,
        y: isMobile() ? 24 : 0,
      });
      radiusProgressRef.current = 1;

      if (staticOnly || framesRef.current.length === 1 || loadError) {
        gsap.set(mediaCol, {
          width: isMobile() ? "100%" : "50%",
          height: isMobile() ? "58%" : "100%",
        });
        gsap.set(copyCol, { autoAlpha: 1, x: 0, y: 0 });
        frameIndexRef.current = 0;
        resizeCanvas();
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: SCRUB,
          invalidateOnRefresh: true,
          onRefresh: () => {
            // Keep end-state layout coherent after resize mid-scroll
            resizeCanvas();
          },
        },
      });

      // 0 → ~30%: play early frames while still fullscreen
      tl.to(
        frameState,
        {
          frame: Math.floor((FRAME_COUNT - 1) * 0.28),
          duration: 0.3,
          onUpdate: () => {
            const next = Math.round(frameState.frame);
            if (next !== frameIndexRef.current) {
              frameIndexRef.current = next;
              scheduleDraw();
            }
          },
        },
        0,
      );

      // ~28% → ~52%: dock frame left (or top on mobile)
      tl.to(
        mediaCol,
        {
          width: () => (isMobile() ? "100%" : "50%"),
          height: () => (isMobile() ? "58%" : "100%"),
          duration: 0.24,
          ease: "power2.inOut",
        },
        0.28,
      );

      // Copy arrives on the right (black)
      tl.to(
        copyCol,
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: 0.2,
          ease: "power2.out",
        },
        0.4,
      );

      // Rest of the sequence while docked
      tl.to(
        frameState,
        {
          frame: FRAME_COUNT - 1,
          duration: 0.48,
          onUpdate: () => {
            const next = Math.round(frameState.frame);
            if (next !== frameIndexRef.current) {
              frameIndexRef.current = next;
              scheduleDraw();
            }
          },
        },
        0.52,
      );

      const refreshFrame = requestAnimationFrame(() => {
        resizeCanvas();
        scheduleDraw();
        ScrollTrigger.refresh();
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        cancelAnimationFrame(refreshFrame);
      };
    },
    {
      dependencies: [ready, staticOnly, loadError, resizeCanvas, scheduleDraw],
      revertOnUpdate: true,
      scope: sectionRef,
    },
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="craft"
      className={cn("pizza-animation relative w-full bg-white", className)}
      style={{
        height: staticOnly || !hasSequence || loadError ? "100svh" : undefined,
      }}
      aria-label="Pizza packing animation"
    >
      <div
        ref={stageRef}
        className="sticky top-0 flex h-dvh w-full overflow-hidden bg-white"
      >
        {/* Media — starts full viewport, docks to left (desktop) / top (mobile) */}
        <div ref={mediaColRef} className="relative h-full w-full">
          <div
            ref={frameRef}
            className="absolute isolate overflow-hidden"
            style={{
              top: FRAME_TOP,
              left: FRAME_INSET,
              right: FRAME_INSET,
              bottom: FRAME_INSET,
              borderRadius: FRAME_RADIUS,
              transform: "translateZ(0)",
              backgroundImage: loadError ? `url(${frameSrc(0)})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <canvas
              ref={canvasRef}
              className="block h-full w-full"
              aria-hidden
            />
          </div>
        </div>

        {/* Copy — absolute on the right so the frame can start truly fullscreen */}
        <div
          ref={copyColRef}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-center px-8 pb-12 md:pointer-events-auto md:inset-y-0 md:right-0 md:left-auto md:w-1/2 md:items-center md:justify-start md:px-12 md:pb-0 lg:px-16"
        >
          <div className="max-w-md text-left">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.28em] text-[#CCFF00] uppercase sm:text-xs sm:tracking-[0.35em]">
              {eyebrow}
            </p>
            <h2 className="text-[2rem] leading-[1.05] font-black tracking-tight text-black sm:text-4xl lg:text-5xl">
              {headline}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-black/70 sm:text-base lg:text-lg">
              {description}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "absolute inset-0 z-20 flex flex-col items-center justify-center bg-white transition-opacity duration-700",
            ready ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          aria-live="polite"
          aria-busy={!ready}
        >
          {loadError ? (
            <p className="px-6 text-center text-sm text-red-500">{loadError}</p>
          ) : (
            <>
              <p className="text-sm font-semibold tracking-[0.3em] text-foreground uppercase">
                Loading…
              </p>
              <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full rounded-full bg-[#CCFF00] transition-[width] duration-200 ease-out"
                  style={{ width: progressLabel }}
                />
              </div>
              <p className="mt-3 font-mono text-xs text-muted">
                {progressLabel}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default PizzaAnimation;
