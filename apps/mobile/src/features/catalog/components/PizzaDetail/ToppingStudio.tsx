"use client";

import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Button, Drawer } from "@heroui/react";
import { ChefHat, Pizza, X } from "lucide-react";
import type { IngredientOption, IngredientChange } from "@repo/api";
import { ProductImage } from "../ProductImage/ProductImage";
import styles from "./ToppingStudio.module.css";

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

export function ToppingImage({ option }: { option: IngredientOption }) {
  const [failed, setFailed] = useState(false);
  const src = option.toppingImageUrl || option.image;
  return src && !failed ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" draggable={false} onError={() => setFailed(true)} />
  ) : <span className={styles.fallback}>{option.name.slice(0, 1)}</span>;
}

export function ToppingStudio({ name, image, options, changes, onChange, language }: {
  name: string; image: string; options: IngredientOption[]; changes: IngredientChange[];
  onChange: (changes: IngredientChange[]) => void; language: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(changes);
  const canvas = useRef<HTMLDivElement>(null);
  const pending = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const de = language === "de";
  const currency = useMemo(
    () => new Intl.NumberFormat(de ? "de-AT" : "en-IE", { style: "currency", currency: "EUR" }),
    [de],
  );
  const selected = (option: IngredientOption) =>
    option.includedByDefault !== draft.some((c) => c.ingredientId === option.ingredientId);
  const applied = useMemo(
    () => options.filter((option) => changes.some((c) => c.ingredientId === option.ingredientId && c.action === (option.includedByDefault ? "remove" : "add"))),
    [options, changes],
  );
  const pendingToppings = options.filter((option) => selected(option));
  const toggle = (option: IngredientOption) => {
    const active = selected(option);
    const rest = draft.filter((c) => c.ingredientId !== option.ingredientId);
    setDraft(
      (active === option.includedByDefault
        ? [
            ...rest,
            {
              ingredientId: option.ingredientId,
              action: option.includedByDefault ? ("remove" as const) : ("add" as const),
            },
          ]
        : rest
      ).sort((a, b) => a.ingredientId.localeCompare(b.ingredientId)),
    );
    setAnnouncement(
      `${option.name} ${active ? (de ? "entfernt" : "removed") : de ? "hinzugefügt" : "added"}`,
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
  const end = (event: PointerEvent<HTMLButtonElement>, option: IngredientOption) => {
    const active = pending.current;
    if (!active || active.pointerId !== event.pointerId) return;
    suppressClick.current = active.moved;
    if (active.moved && inside(event.clientX, event.clientY) && !selected(option)) toggle(option);
    pending.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const dragged = options.find((o) => o.ingredientId === drag?.id);
  const over = !!drag?.moved && drag.over;

  return <>
    <button className={styles.cta} type="button" onClick={() => { setDraft(changes); setOpen(true); }} aria-haspopup="dialog" aria-expanded={open}>
      <span className={styles.ctaIcon} aria-hidden="true"><Pizza size={26} /></span>
      <span className={styles.ctaCopy}>
        <strong>{de ? "Wähle deine Beläge" : "Choose your own toppings"}</strong>
        <small>{de ? "Mach sie genau nach deinem Geschmack." : "Make it yours, no limits."}</small>
      </span>
      {applied.length > 0 && <span className={styles.ctaBadge}>{applied.length}</span>}
      <span className={styles.ctaGo} aria-hidden="true"><ChefHat size={19} /></span>
    </button>
    {applied.length > 0 && <div className={styles.applied} aria-label={de ? "Gewählte Beläge" : "Chosen toppings"}>
      <div className={styles.avatarGroup} aria-hidden="true">
        {applied.slice(0, 5).map((option) => <span key={option.ingredientId} className={styles.avatar}><ToppingImage option={option} /></span>)}
      </div>
      <span>{applied.length} {de ? "Änderungen gewählt" : "topping changes"}</span>
      <button type="button" onClick={() => { setDraft(changes); setOpen(true); }}>{de ? "Bearbeiten" : "Edit"}</button>
    </div>}
    <Drawer isOpen={open} onOpenChange={setOpen}>
      <Drawer.Backdrop className={styles.backdrop}>
        <Drawer.Content placement="bottom" className={styles.sheet}>
          <Drawer.Dialog className={styles.dialog}>
            <div className={styles.handle} aria-hidden="true" />
            <header className={styles.sheetHeader}>
              <div>
                <Drawer.Heading>{de ? "Wähle deine Beläge" : "Choose your own toppings"}</Drawer.Heading>
                <p>{de ? "Antippen zum Auswählen oder auf die Pizza ziehen." : "Tap to select, or drag onto your pizza."}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={de ? "Schließen" : "Close"}><X size={22} /></button>
            </header>
            <div className={styles.sheetBody}>
              <div className={styles.preview}>
                <div
                  ref={canvas}
                  className={styles.canvas}
                  data-over={over}
                  role="img"
                  aria-label={`${name}. ${pendingToppings.map((o) => o.name).join(", ") || (de ? "klassisch" : "classic")}`}
                  data-testid="topping-drop-zone"
                >
                  <ProductImage src={image} alt="" className={styles.pizza} />
                  <div className={styles.pieces} aria-hidden="true">
                    {/* Default toppings are baked into the base photo; only add-ons get layers. */}
                    {options.filter((option) => !option.includedByDefault).map((option, layerIndex) => {
                      const active = selected(option);
                      const seed = [...option.ingredientId].reduce((sum, c) => sum + c.charCodeAt(0), 0);
                      return (
                        <div
                          key={option.ingredientId}
                          data-testid={`topping-layer-${option.ingredientId}`}
                          data-active={active}
                          className={styles.layer}
                        >
                          {Array.from({ length: 9 }, (_, index) => {
                            const angle = ((index * 137.5 + seed * 7) * Math.PI) / 180;
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
              </div>
              <section aria-labelledby="topping-list-title">
                <div className={styles.gridHeader}>
                  <h3 id="topping-list-title">{de ? "Alle Beläge" : "All toppings"}</h3>
                  <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
                </div>
                <div className={styles.grid}>{options.map((option) => {
                  const active = selected(option);
                  return (
                    <button
                      key={option.ingredientId}
                      type="button"
                      draggable={false}
                      data-dragging={(drag?.moved && drag.id === option.ingredientId) || undefined}
                      className={styles.option}
                      aria-pressed={active}
                      aria-label={`${active ? (de ? "Entfernen" : "Remove") : de ? "Hinzufügen" : "Add"} ${option.name}`}
                      data-testid={`topping-choice-${option.ingredientId}`}
                      onPointerDown={(event) => {
                        if (!event.isPrimary || event.button !== 0 || pending.current) return;
                        suppressClick.current = false;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        pending.current = {
                          id: option.ingredientId,
                          pointerId: event.pointerId,
                          startX: event.clientX,
                          startY: event.clientY,
                          x: event.clientX,
                          y: event.clientY,
                          moved: false,
                          over: false,
                        };
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
                        if (!suppressClick.current || event.detail === 0) toggle(option);
                        suppressClick.current = false;
                      }}
                    >
                      <span className={styles.optionImage}>
                        <ToppingImage option={option} />
                        <span className={styles.mark}>{active ? "−" : "+"}</span>
                      </span>
                      <strong>{option.name}</strong>
                      <small>{currency.format((option.includedByDefault ? 0 : option.priceCents) / 100)}</small>
                    </button>
                  );
                })}</div>
              </section>
              {pendingToppings.length > 0 && <section className={styles.selected} aria-labelledby="selected-toppings-title">
                <div className={styles.selectedHeader}>
                  <h3 id="selected-toppings-title">{de ? `Deine Beläge (${pendingToppings.length})` : `Your toppings (${pendingToppings.length})`}</h3>
                  <button type="button" onClick={() => setDraft([])}>{de ? "Alle löschen" : "Clear all"}</button>
                </div>
                <div className={styles.chips}>{pendingToppings.map((option) => (
                  <button key={option.ingredientId} type="button" onClick={() => toggle(option)}>
                    <span><ToppingImage option={option} /></span>{option.name}<X size={13} />
                  </button>
                ))}</div>
              </section>}
            </div>
            <footer className={styles.footer}>
              <Button className={styles.apply} data-testid="topping-apply" onPress={() => { onChange(draft); setOpen(false); }}>
                {de ? "Beläge übernehmen" : "Apply toppings"}
              </Button>
            </footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
    {drag?.moved && dragged &&
      createPortal(
        <div className={styles.ghost} data-testid="topping-drag-image" aria-hidden="true" style={{ left: drag.x, top: drag.y }}>
          <ToppingImage option={dragged} />
        </div>,
        document.body,
      )}
  </>;
}
