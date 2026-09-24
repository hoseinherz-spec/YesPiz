"use client";
import { BrandLogo } from "@/components/BrandLogo";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, Check, MapPin } from "@/components/animated-icon/icons";
import { useApp } from "@/context/AppContext";
import styles from "./welcome.module.css";
import "./welcome-motion.css";

const copy = {
  en: [
    { eyebrow: "01 — MADE FRESH", title: ["Good things", "come", "in slices."], body: "Golden crust. Real ingredients. Pizza worth making plans for.", image: "/images/welcome/pizza-making.png" },
    { eyebrow: "02 — MAKE IT YOURS", title: ["Big cravings.", "Your kind", "of pizza."], body: "Find your favorite. Pick your size. We’ll take care of the delicious part.", image: "/images/banners/pizza-editorial-v1.png" },
    { eyebrow: "03 — ENJOY EVERY MOMENT", title: ["Less waiting.", "More", "pizza nights."], body: "Follow your order from our kitchen to your door. Then dig in together.", image: "/images/banners/pizza-sharing-v1.png" },
  ],
  de: [
    { eyebrow: "01 — FRISCH GEMACHT", title: ["Das Glück", "kommt", "in Stücken."], body: "Goldene Kruste. Echte Zutaten. Pizza, auf die du dich freuen kannst.", image: "/images/welcome/pizza-making.png" },
    { eyebrow: "02 — GANZ DEIN GESCHMACK", title: ["Großer Hunger.", "Deine", "Lieblingspizza."], body: "Finde deinen Favoriten und wähle deine Größe. Wir kümmern uns um den Genuss.", image: "/images/banners/pizza-editorial-v1.png" },
    { eyebrow: "03 — ZEIT FÜR GENUSS", title: ["Weniger warten.", "Mehr", "Pizza-Abende."], body: "Verfolge deine Bestellung bis an deine Tür. Und genieße sie zusammen.", image: "/images/banners/pizza-sharing-v1.png" },
  ],
};

function SlideDetail({ slide, de }: { slide: number; de: boolean }) {
  if (slide === 0) return <div className={styles.freshStamp}><span>100%</span><small>{de ? "FRISCH GEMACHT" : "FRESHLY MADE"}</small><svg viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="2" /></svg></div>;
  if (slide === 1) return <div className={styles.orderCard}>
    <div><small>{de ? "DEIN NÄCHSTER FAVORIT" : "YOUR NEXT FAVORITE"}</small><strong>Pepperoni</strong><span>{de ? "Knusprig. Würzig. Genau richtig." : "Crispy. A little spicy. All yours."}</span></div>
    <div className={styles.sizes}><span>S</span><span>M</span><span className={styles.selectedSize}>L<Check size={12} /></span><span>XL</span></div>
  </div>;
  return <div className={styles.trackingCard}>
    <span className={styles.trackingIcon}><MapPin size={23} /></span>
    <div><small>{de ? "VON UNS BIS ZU DIR" : "FROM OUR KITCHEN TO YOU"}</small><strong>{de ? "Vorfreude inklusive." : "Good things are on the way."}</strong><div className={styles.deliverySteps}><i /><span /><i /><span /><i /></div></div>
  </div>;
}

export default function WelcomePage() {
  const { language, completeWelcome, onboarded, authed } = useApp();
  const router = useRouter();
  const de = language === "de";
  const slides = copy[de ? "de" : "en"];
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const block = stage.current?.querySelector(`[data-page-id="${active + 1}"] .t-stagger`);
    if (!block) return;
    block.classList.remove("is-shown");
    void (block as HTMLElement).offsetHeight;
    block.classList.add("is-shown");
  }, [active]);

  function finish() {
    if (leaving) return;
    setLeaving(true);
    completeWelcome();
    router.replace(onboarded ? (authed ? "/home/" : "/auth/sign-in/") : "/onboarding/");
  }
  function go(index: number) { setActive(Math.max(0, Math.min(slides.length - 1, index))); }

  return <main lang={de ? "de" : "en"} className={`${styles.root} welcome-carousel`}>
    <div className={styles.shell} role="region" aria-roledescription="carousel" aria-label={de ? "Willkommen bei YesPiz" : "Welcome to YesPiz"}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); go(active + 1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); go(active - 1); }
      }}
      onPointerDown={(event) => { pointer.current = { x: event.clientX, y: event.clientY }; }}
      onPointerCancel={() => { pointer.current = null; }}
      onPointerUp={(event) => {
        const start = pointer.current; pointer.current = null;
        if (!start) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) go(active + (dx < 0 ? 1 : -1));
      }}>
      <header className={styles.header}>
        <BrandLogo />
        <button type="button" className={styles.skip} onClick={finish} disabled={leaving}>{de ? "Überspringen" : "Skip"} <ArrowRight size={15} /></button>
      </header>
      <div ref={stage} className={`${styles.stage} t-page-slide`} data-page={active + 1}>
        {slides.map((slide, index) => <section key={index} className={`${styles.slide} t-page`} data-page-id={index + 1} data-active={active === index} aria-hidden={active !== index} inert={active !== index} aria-roledescription="slide" aria-label={`${index + 1} / 3`} style={{ "--t-page-from-x": `${index < active ? -8 : 8}px` } as CSSProperties}>
          <div className={styles.photo}><Image src={slide.image} alt="" fill priority={index === 0} sizes="(max-width: 520px) 100vw, 480px" draggable={false} /></div>
          <div className={styles.shade} />
          <div className={styles.detail} aria-hidden="true"><SlideDetail slide={index} de={de} /></div>
          <div className={styles.copy}>
            <p className={styles.eyebrow}><span />{slide.eyebrow}</p>
            <div key={active === index ? `active-${index}` : `idle-${index}`} className="t-stagger">
              <h1 className={styles.title}>{slide.title.map((line, i) => <span key={line} className={`t-stagger-line t-stagger-line--${i + 1}`}>{line}</span>)}</h1>
              <p className={`${styles.body} t-stagger-line t-stagger-line--4`}>{slide.body}</p>
            </div>
          </div>
        </section>)}
      </div>
      <footer className={styles.footer}>
        <div className={styles.progress} aria-label={de ? "Willkommensseiten" : "Welcome slides"}>
          {slides.map((slide, index) => <button key={index} type="button" className={styles.dot} aria-label={`${de ? "Seite" : "Slide"} ${index + 1}: ${slide.title.join(" ")}`} aria-current={index === active ? "step" : undefined} onClick={() => go(index)}><span /></button>)}
          <span className={styles.counter} aria-hidden="true">0{active + 1}<span> / 03</span></span>
        </div>
        <div className={styles.actions}>
        {active > 0 && <button type="button" className={styles.back} onClick={() => go(active - 1)} aria-label={de ? "Zurück" : "Previous slide"}><ChevronLeft size={22} /></button>}
        <button type="button" className={styles.next} disabled={leaving} onClick={() => active === slides.length - 1 ? finish() : go(active + 1)}>
          <span>{active === slides.length - 1 ? (de ? "Los geht’s" : "Let’s get started") : (de ? "Weiter" : "Next")}</span><span className={styles.arrow}><ArrowRight size={23} /></span>
        </button>
        </div>
      </footer>
      <span className="sr-only" aria-live="polite" aria-atomic="true">{de ? "Seite" : "Slide"} {active + 1} {de ? "von" : "of"} 3: {slides[active]!.title.join(" ")}</span>
    </div>
  </main>;
}
