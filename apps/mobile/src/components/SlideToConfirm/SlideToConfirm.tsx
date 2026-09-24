"use client";

// Bencho Slide to confirm (MIT): https://bencho.dev/licence
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./SlideToConfirm.module.css";

/* ══ Slide to confirm ═════════════════════════════════════
   A handle you push across a track. It follows the finger
   exactly, and past the mark it takes over and finishes the
   journey itself.

   THE HANDLE BECOMES THE ANSWER. On commit it does not hand
   over to a tick somewhere else — it unfurls leftward and
   fills the track it was crossing, and the arrow it was
   carrying becomes a check. One object changing shape, which
   is the case a morph is actually for, and the reason this
   needs no second element to say "done".

   The right edge does not move while that happens: the width
   grows by exactly what the offset loses. So the handle
   arrives, plants itself, and opens out behind it. */
const H = 56;
/* the inset the handle keeps from the track, all four sides */
const PAD = 4;
/* the handle is a circle in a 56 track, so it is sized by the
   HEIGHT and the width knob does not touch it. Widening the
   track buys travel, not a longer handle — the thing you push
   stays the thing you push. */
const GRIP = H - PAD * 2;
/* ── how far the swell is, and it is TINY ──────────────────
   The dot sits four pixels inside the track, so the ring round
   it is the whole budget for a hover. 3% of 48 is 1.4, which
   is 0.7 a side and leaves 3.3 — the liquid toggle's note is
   the long version of this arithmetic. */
const SWELL = 1.03;
const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

export function SlideToConfirm({
  disabled = false,
  label = "Slide to confirm",
  confirmedLabel = "Confirmed",
  onConfirm,
}: {
  disabled?: boolean;
  label?: string;
  confirmedLabel?: string;
  onConfirm: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const grab = useRef<{ id: number; offset: number } | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  const live = useRef<{ move: (event: PointerEvent) => void; up: (event: PointerEvent) => void }>({ move: () => {}, up: () => {} });
  const mounted = useRef(true);
  const committed = useRef(false);
  const reduced = useReducedMotion();
  const [span, setSpan] = useState(280);
  const [held, setHeld] = useState(false);
  const [done, setDone] = useState(false);
  const [hot, setHot] = useState(false);
  const x = useMotionValue(0);
  /* ── where the handle planted itself ─────────────────────
     Zero except while it is unfurling, and then it is the
     offset the handle had when it committed. The width is
     `GRIP + (anchor - x)`, so PAD + x + width comes to
     PAD + GRIP + anchor — a number with no x in it. The right
     edge is therefore stationary BY ARITHMETIC rather than by
     two animations agreeing.

     It was two: `x` on one spring and `width` on another with
     the same numbers, which is not the same thing at all. They
     start a frame apart and drift, and the right edge measured
     6.8px of wobble across the morph. One value read twice
     cannot do that. */
  const anchor = useMotionValue(0);
  const shown = useMotionValue(1);
  const pulse = useMotionValue(1);
  const travel = Math.max(0, span - PAD * 2 - GRIP);
  const seen = useTransform(() => clamp(x.get(), 0, travel));
  const wide = useTransform(() => GRIP + clamp(anchor.get() - seen.get(), 0, travel));
  const wash = useTransform(() => seen.get() + GRIP);
  const progress = useTransform(() => seen.get() / Math.max(1, travel));
  const labelOpacity = useTransform(progress, [0, 0.62], [1, 0]);
  /* Read off x alone this faded back IN during the unfurl:
     committing sends x home to zero, so the arrow reappeared
     underneath the word it had just been replaced by. `shown`
     is switched by the commit itself, which is the event that
     actually means the arrow is finished. */
  const arrow = useTransform(() => shown.get() * clamp(1 - (progress.get() - .55) / .4, 0, 1));
  const squash = useTransform(() => 1 - Math.min(.08, Math.max(0, -x.get()) / 110));
  /* Both scales ride the same product — the swell has to be
     multiplied INTO the transform rather than set as its own
     scale property, which applies first and would move the
     handle along the track it is sitting on. */
  const scaleX = useTransform(() => squash.get() * (hot && !held && !done && !reduced ? SWELL : 1));
  const scaleY = useTransform(() => 1 / squash.get() * (hot && !held && !done && !reduced ? SWELL : 1));
  /* zeta = c / (2 * sqrt(k * m)), so c at zeta 1 is
     2 * sqrt(k * m). The commit has a hard wall, so no overshoot. */
  const spring = { type: "spring" as const, stiffness: 580, damping: 2 * Math.sqrt(580 * .9), mass: .9 };

  useEffect(() => {
    mounted.current = true;
    const element = track.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setSpan(element.clientWidth);
      cleanup.current?.();
      grab.current = null;
      setHeld(false);
      if (committed.current) {
        anchor.set(Math.max(0, element.clientWidth - PAD * 2 - GRIP));
        return;
      }
      x.stop();
      x.set(0);
    });
    observer.observe(element);
    return () => { mounted.current = false; observer.disconnect(); cleanup.current?.(); x.stop(); anchor.stop(); shown.stop(); pulse.stop(); };
  }, [x, anchor, shown, pulse]);

  const finish = async () => {
    if (disabled || committed.current || travel <= 0) return;
    committed.current = true;
    setDone(true);
    x.stop();
    x.set(travel);
    /* ── x goes to ZERO, and that is the whole morph ────────
       The handle is placed by `x` and sized by `width`, and on
       commit they move by the same amount in opposite
       directions: x loses TRAVEL, width gains it. Their sum is
       the right edge, so the right edge does not move — the
       handle plants itself where it arrived and opens out
       behind it. */
    anchor.set(travel);
    animate(shown, 0, { duration: reduced ? 0 : .12 });
    if (!reduced) animate(pulse, [1, .974, 1], { duration: .46, times: [0, .62, 1], ease: [.33, .55, .2, 1], delay: .1 });
    await animate(x, 0, reduced ? { duration: 0 } : spring);
    // Checkout owns completion: don't auto-reset and permit duplicate navigation.
    if (mounted.current) onConfirm();
  };

  const release = (event: PointerEvent) => {
    if (!grab.current || grab.current.id !== event.pointerId) return;
    grab.current = null;
    cleanup.current?.();
    try { track.current?.releasePointerCapture(event.pointerId); } catch { /* never captured */ }
    setHeld(false);
    /* The only honest answer is the end of the track, so the end
       is what it is. Cancellation must never confirm an order. */
    if (event.type !== "pointercancel" && !disabled && x.get() >= travel) {
      void finish();
    } else {
      // Return energy becomes a squash at the wall; position itself is clamped.
      void animate(x, 0, reduced ? { duration: 0 } : { ...spring, damping: spring.damping * .62 });
    }
  };
  const local = (clientX: number) => {
    const bounds = track.current?.getBoundingClientRect();
    return bounds ? (clientX - bounds.left) / (bounds.width / span || 1) : 0;
  };
  useLayoutEffect(() => { live.current = {
    move: (event) => {
      if (!grab.current || event.pointerId !== grab.current.id || disabled || done) return;
      x.set(clamp(local(event.clientX) - grab.current.offset, 0, travel));
    },
    up: release,
  }; });

  return (
    <div className={styles.root} data-disabled={disabled || undefined}>
      <motion.div
        ref={track}
        className={styles.track}
        data-held={held || undefined}
        data-done={done || undefined}
        style={{ scale: pulse }}
      >
        {/* It is the ground the handle has covered, which is why
            it ends AT the handle rather than under it. */}
        <motion.i className={styles.wash} aria-hidden="true" style={{ width: wash }} />
        <motion.span className={styles.label} style={{ opacity: labelOpacity }}>
          {label}
        </motion.span>
        <motion.button
          type="button"
          className={styles.grip}
          disabled={disabled || done}
          aria-label={done ? confirmedLabel : label}
          style={{ x: seen, width: wide, scaleX, scaleY }}
          onPointerEnter={() => setHot(true)}
          onPointerLeave={() => setHot(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void finish(); }
          }}
          onPointerDown={(event) => {
            if (disabled || committed.current || grab.current || event.button !== 0) return;
            event.preventDefault();
            x.stop();
            // A press starts on the handle, so the grab offset is known now.
            grab.current = { id: event.pointerId, offset: local(event.clientX) - x.get() };
            setHeld(true);
            try { track.current?.setPointerCapture(event.pointerId); } catch { /* not live */ }
            /* THE DRAG IS FOLLOWED ON THE WINDOW, AND BOUND AT THE PRESS.
               Capture is best-effort. Window listeners keep releases outside
               the track working; binding now avoids dropping fast first moves
               while waiting for a React effect to run. */
            const move = (e: PointerEvent) => live.current.move(e);
            const up = (e: PointerEvent) => live.current.up(e);
            const blur = () => { grab.current = null; setHeld(false); cleanup.current?.(); x.set(0); };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
            window.addEventListener("pointercancel", up);
            window.addEventListener("blur", blur);
            cleanup.current = () => {
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", up);
              window.removeEventListener("pointercancel", up);
              window.removeEventListener("blur", blur);
              cleanup.current = null;
            };
          }}
        >
          <motion.span className={styles.arrows} style={{ opacity: arrow }} aria-hidden="true"><ChevronRight /><ChevronRight /><ChevronRight /></motion.span>
          {/* the word only exists once there is room for it, and
              it arrives with the width rather than after it */}
          <motion.span className={styles.done} aria-hidden="true" initial={false} animate={{ opacity: done ? 1 : 0, scale: done ? 1 : .7 }} transition={{ duration: reduced ? 0 : .18 }}><Check size={20} />{confirmedLabel}</motion.span>
        </motion.button>
      </motion.div>
      <span className="sr-only" role="status">{done ? confirmedLabel : ""}</span>
    </div>
  );
}
