"use client";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { ScrollShadow } from "@heroui/react";
import type { IngredientOption, IngredientChange } from "@repo/api";
import { ProductImage } from "../ProductImage/ProductImage";
import styles from "./ToppingStudio.module.css";
import { PageHero } from "@repo/ui/mobile-page-transition";

type Drag = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
  over: boolean;
};
export function ToppingStudio({
  name,
  image,
  baseImage,
  options,
  changes,
  onChange,
  language,
  scale = 1,
  heroId,
}: {
  name: string;
  image: string;
  baseImage?: string;
  options: IngredientOption[];
  changes: IngredientChange[];
  onChange: (changes: IngredientChange[]) => void;
  language: string;
  scale?: number;
  heroId: string;
}) {
  const canvas = useRef<HTMLDivElement>(null);
  const pending = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const de = language === "de";
  const selected = (option: IngredientOption) =>
    option.includedByDefault !==
    changes.some((c) => c.ingredientId === option.ingredientId);
  const toggle = (option: IngredientOption) => {
    const wasSelected = selected(option);
    const rest = changes.filter((c) => c.ingredientId !== option.ingredientId);
    onChange(
      (wasSelected === option.includedByDefault
        ? [
            ...rest,
            {
              ingredientId: option.ingredientId,
              action: option.includedByDefault
                ? ("remove" as const)
                : ("add" as const),
            },
          ]
        : rest
      ).sort((a, b) => a.ingredientId.localeCompare(b.ingredientId)),
    );
    setAnnouncement(
      `${option.name} ${wasSelected ? (de ? "entfernt" : "removed") : de ? "hinzugefügt" : "added"}`,
    );
  };
  const inside = (x: number, y: number) => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect) return false;
    return (
      Math.hypot(
        (x - rect.left - rect.width / 2) / (rect.width / 2),
        (y - rect.top - rect.height / 2) / (rect.height / 2),
      ) <= 1
    );
  };
  const end = (
    event: PointerEvent<HTMLButtonElement>,
    option: IngredientOption,
  ) => {
    const active = pending.current;
    if (!active || active.pointerId !== event.pointerId) return;
    suppressClick.current = active.moved;
    if (
      active.moved &&
      inside(event.clientX, event.clientY) &&
      !selected(option)
    )
      toggle(option);
    pending.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const dragged = options.find((o) => o.ingredientId === drag?.id);
  const over = !!drag?.moved && drag.over;
  return (
    <>
      <div className={styles.stage}>
        <PageHero id={heroId}>
          <div
            ref={canvas}
            className={styles.canvas}
            data-over={over}
            style={{ width: `${scale * 100}%` }}
            role="img"
            aria-label={`${name}. ${options
              .filter(selected)
              .map((o) => o.name)
              .join(", ")}`}
            data-testid="topping-drop-zone"
          >
            <ProductImage
              src={baseImage || image}
              alt=""
              className={styles.pizza}
            />
            <div className={styles.pieces} aria-hidden="true">
              {options
                .filter((o) => baseImage || !o.includedByDefault)
                .map((option, layerIndex) => {
                  const active = selected(option);
                  const seed = [...option.ingredientId].reduce(
                    (sum, c) => sum + c.charCodeAt(0),
                    0,
                  );
                  return (
                    <div
                      key={option.ingredientId}
                      data-testid={`topping-layer-${option.ingredientId}`}
                      data-active={active}
                      className={styles.layer}
                    >
                      {Array.from({ length: 9 }, (_, index) => {
                        const angle =
                          ((index * 137.5 + seed * 7) * Math.PI) / 180;
                        const radius = 9 + Math.sqrt(index / 8) * 28;
                        return (
                          <span
                            key={index}
                            className={styles.piece}
                            style={
                              {
                                left: `${50 + Math.cos(angle) * radius}%`,
                                top: `${50 + Math.sin(angle) * radius}%`,
                                "--rotation": `${index * 51 + seed}deg`,
                                "--delay": `${index * 27 + (layerIndex % 3) * 10}ms`,
                              } as CSSProperties
                            }
                          >
                            <ToppingImage option={option} />
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
            <span className={styles.dropHint} aria-hidden="true">
              {de ? "Hier ablegen" : "Drop to add"}
            </span>
          </div>
        </PageHero>
      </div>
      <section
        className={styles.controls}
        aria-label={de ? "Belag anpassen" : "Customize toppings"}
      >
        <p>
          {de
            ? "Antippen zum Auswählen oder auf die Pizza ziehen."
            : "Tap to select, or drag onto your pizza."}
        </p>
        <ScrollShadow
          orientation="horizontal"
          hideScrollBar
          size={34}
          className={styles.rail}
        >
          <h2 className={styles.railLabel}>
            <span>{de ? "Belag" : "Toppings"}</span>
          </h2>
          {options.map((option) => {
            const active = selected(option);
            return (
              <button
                key={option.ingredientId}
                type="button"
                draggable={false}
                data-dragging={
                  (drag?.moved && drag.id === option.ingredientId) || undefined
                }
                className={styles.ingredient}
                aria-label={`${active ? (de ? "Entfernen" : "Remove") : de ? "Hinzufügen" : "Add"} ${option.name}`}
                aria-pressed={active}
                data-testid={`topping-choice-${option.ingredientId}`}
                onPointerDown={(event) => {
                  if (!event.isPrimary || event.button !== 0 || pending.current)
                    return;
                  suppressClick.current = false;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  const next = {
                    id: option.ingredientId,
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    x: event.clientX,
                    y: event.clientY,
                    moved: false,
                    over: false,
                  };
                  pending.current = next;
                }}
                onPointerMove={(event) => {
                  if (
                    !pending.current ||
                    pending.current.id !== option.ingredientId ||
                    pending.current.pointerId !== event.pointerId
                  )
                    return;
                  const next = {
                    ...pending.current,
                    x: event.clientX,
                    y: event.clientY,
                    over: inside(event.clientX, event.clientY),
                    moved:
                      pending.current.moved ||
                      Math.hypot(
                        event.clientX - pending.current.startX,
                        event.clientY - pending.current.startY,
                      ) > 14,
                  };
                  pending.current = next;
                  if (next.moved) setDrag(next);
                }}
                onPointerUp={(event) => end(event, option)}
                onPointerCancel={() => {
                  suppressClick.current = true;
                  pending.current = null;
                  setDrag(null);
                }}
                onLostPointerCapture={() => {
                  pending.current = null;
                  setDrag(null);
                }}
                onClick={(event) => {
                  if (!suppressClick.current || event.detail === 0)
                    toggle(option);
                  suppressClick.current = false;
                }}
              >
                <span className={styles.dish}>
                  <ToppingImage option={option} />
                  <span className={styles.mark}>{active ? "−" : "+"}</span>
                </span>
                <span className={styles.name}>{option.name}</span>
                <span className={styles.price}>
                  {new Intl.NumberFormat(de ? "de-AT" : "en-IE", {
                    style: "currency",
                    currency: "EUR",
                  }).format(
                    (option.includedByDefault ? 0 : option.priceCents) / 100,
                  )}
                </span>
              </button>
            );
          })}
        </ScrollShadow>
        <span className="sr-only" role="status" aria-live="polite">
          {announcement}
        </span>
      </section>
      {drag?.moved &&
        dragged &&
        createPortal(
          <div
            className={styles.ghost}
            data-testid="topping-drag-image"
            aria-hidden="true"
            style={{ left: drag.x, top: drag.y }}
          >
            <ToppingImage option={dragged} />
          </div>,
          document.body,
        )}
    </>
  );
}
function ToppingImage({ option }: { option: IngredientOption }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const src = option.toppingImageUrl || option.image;
  return src && failedSrc !== src ? (
    // Small transparent cutouts also support app-local assets in the static mobile export.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" draggable={false} onError={() => setFailedSrc(src)} />
  ) : (
    <span className={styles.fallback}>{option.name.slice(0, 1)}</span>
  );
}
