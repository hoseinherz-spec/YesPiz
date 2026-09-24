"use client";

import { ChevronLeft } from "@/components/animated-icon/icons";
import { Bookmark } from "lucide-react";
import { useId, useRef, useState } from "react";
import "./pizza-size-motion.css";
import type { PizzaSelection, IngredientChange } from "@repo/api";
import { PageHero } from "@repo/ui/mobile-page-transition";
import { FlowReveal } from "@/components/motion/FlowReveal";
import { ToppingStudio } from "./ToppingStudio";
import { AddToCart } from "./AddToCart";
import { ProductOptions } from "./ProductOptions";
import { pizzaOptions } from "./pizza-order";
import { PizzaDescription } from "./PizzaDescription";
import { pizzaDescription } from "@/constants/i18n";
import { Star, Clock, TakeoutFood, PercentageCircle } from "@repo/icons";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppFrame } from "@/components/AppFrame";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { SlidingNumber } from "@/components/SlidingNumber";
import { resolveProductImage } from "@/constants/pizzas";
import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { useMenuCatalog } from "@/lib/catalog";
import { ProductImage } from "../ProductImage/ProductImage";
import type { PizzaDetailProps } from "./PizzaDetail.types";
import styles from "./PizzaDetail.module.css";
import { PizzaDetailSkeleton } from "./PizzaSkeletons";
import { PizzaComments } from "./PizzaComments";
import { reviewMetrics } from "./review-metrics";
import { ScrollHeader } from "@/components/ScrollHeader";
import { saveUsualPizza, useUsualPizzas } from "@/lib/usual-pizzas";

const currencyFormat: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export function PizzaDetail({ id }: PizzaDetailProps) {
  const searchParams = useSearchParams();
  const fromFeatured = searchParams.get("source") === "featured";
  const usualId = searchParams.get("usual");
  const heroId = fromFeatured ? `featured-${id}` : id;
  const { language, isFavorite, toggleFavorite } = useApp();
  const { sizes } = useCart();
  const hero = useRef<HTMLDivElement>(null);
  const sizeGroupId = useId();
  const [adding, setAdding] = useState(false);
  const [usualSaved, setUsualSaved] = useState(false);
  const [ingredientState, setIngredientState] = useState<{ id: string; changes: IngredientChange[] | null }>({ id, changes: null });
  const [selections, setSelections] = useState<PizzaSelection[] | null>(null);
  const [sizeChoice, setSizeChoice] = useState<{
    pizzaId: string;
    sizeId: string;
  } | null>(null);
  const { getById, isLoading, categories, menuVersion } = useMenuCatalog();
  const { items: usualPizzas } = useUsualPizzas();
  const pizza = getById(id);
  const locale = language === "de" ? "de-DE" : "en-IE";

  if (!pizza && isLoading) return <PizzaDetailSkeleton backHref={fromFeatured ? "/home/" : "/menu/"} />;

  if (!pizza) {
    return (
      <AppFrame>
        <p role="status">
          {isLoading
            ? language === "de"
              ? "Wird geladen…"
              : "Loading pizza details…"
            : language === "de"
              ? "Pizza nicht gefunden"
              : "Pizza not found"}
        </p>
        {!isLoading && (
          <Link href="/menu/">
            {language === "de" ? "Zur Speisekarte" : "Back to menu"}
          </Link>
        )}
      </AppFrame>
    );
  }

  const usual = usualPizzas.find((item) => item.id === usualId && item.pizzaId === (pizza.pizzaId ?? pizza.id));
  const validUsualSelections = (usual?.selections ?? []).filter((selection) => {
    const group = pizza.customization?.groups.find((item) => item.id === selection.groupId);
    return !!group && selection.optionIds.every((optionId) => group.options.some((option) => option.id === optionId && option.isActive));
  });
  const usualIngredients = (usual?.extras ?? []).flatMap((ingredientId) => {
    const ingredient = pizza.ingredientOptions?.find((option) => option.ingredientId === ingredientId);
    return ingredient ? [{ ingredientId, action: ingredient.includedByDefault ? "remove" as const : "add" as const }] : [];
  });
  const activeSelections = selections ?? validUsualSelections;
  const activeIngredientChanges = ingredientState.id === id && ingredientState.changes !== null
    ? ingredientState.changes
    : usualIngredients;

  const sizeOptions = pizza.customization
    ? pizza.customization.variants
        .filter((variant) => variant.isActive)
        .map((variant) => ({
          id: variant.id,
          label: variant.name,
          price: variant.priceCents / 100,
        }))
    : sizes.map((size) => ({
        id: size.id,
        label: size.label,
        price: Math.max(0, pizza.price + size.delta),
      }));
  const defaultSize =
    sizeOptions.find((size) => /^(medium|m|mittel)$/i.test(size.label)) ??
    sizeOptions[0];
  const usualSize = usual?.variantId ?? (!pizza.customization ? usual?.size : undefined);
  const selectedSize = sizeOptions.find((size) => sizeChoice?.pizzaId === id && size.id === sizeChoice.sizeId)
    ?? sizeOptions.find((size) => size.id === usualSize)
    ?? defaultSize;
  const hasMultipleSizes = sizeOptions.length > 1;
  const selectedIndex = Math.max(
    0,
    sizeOptions.findIndex((size) => size.id === selectedSize?.id),
  );
  const options = pizzaOptions(
    pizza.customization,
    selectedSize?.id ?? "",
    activeSelections,
  );
  const ingredientOptions = pizza.ingredientOptions ?? [];
  const ingredientChanges = activeIngredientChanges.filter(change => ingredientOptions.some(option => option.ingredientId === change.ingredientId && change.action === (option.includedByDefault ? 'remove' : 'add')));
  const ingredientExtra = ingredientChanges.reduce((sum, change) => sum + (change.action === 'add' ? ingredientOptions.find(o => o.ingredientId === change.ingredientId)?.priceCents ?? 0 : 0), 0) / 100;
  const ingredientLabels = ingredientChanges.map(change => `${change.action === 'add' ? (language === 'de' ? 'Extra' : 'Add') : (language === 'de' ? 'Ohne' : 'No')} ${ingredientOptions.find(o => o.ingredientId === change.ingredientId)?.name ?? ''}`);
  const displayPrice =
    (selectedSize?.price ?? pizza.price) + options.extraPrice + ingredientExtra;
  const favoriteId = pizza.pizzaId ?? pizza.id;
  const fav = isFavorite(favoriteId);
  const image = resolveProductImage(pizza);
  const { rating, reviewCount } = reviewMetrics(pizza.presentation);

  const discountField = pizza.presentation?.fields.find(({ name }) =>
    ["discountpercent", "discountpercentage", "discount"].includes(
      name.toLowerCase().replace(/[^a-z]/g, ""),
    ),
  );
  const discountValue = Number(discountField?.value.trim().replace(/%$/, ""));
  const discountPercent =
    Number.isFinite(discountValue) && discountValue > 0 && discountValue <= 100
      ? discountValue
      : null;

  const description = pizzaDescription(pizza, language);
  const cookingTimeField =
    pizza.presentation?.fields.find(({ name }) =>
      ["cookingtime", "preparationtime", "preptime"].includes(
        name.toLowerCase().replace(/[^a-z]/g, ""),
      ),
    )?.value;
  const cookingTime = typeof pizza.cookTimeSeconds === "number" && Number.isFinite(pizza.cookTimeSeconds) && pizza.cookTimeSeconds > 0
    ? `${Math.max(1, Math.ceil(pizza.cookTimeSeconds / 60))} ${language === "de" ? "Min." : "min"}`
    : cookingTimeField || (language === "de" ? "Beim Checkout bestätigt" : "Confirmed at checkout");
  const category =
    categories.find(({ id }) => id === pizza.categoryId)?.name ||
    pizza.presentation?.fields.find(({ name }) =>
      /^(food ?category|category)$/i.test(name),
    )?.value ||
    (pizza.categoryId
      ? language === "de"
        ? "Nicht angegeben"
        : "Not provided"
      : "Pizza");

  return (
    <AppFrame
      padded={false}
      className={`${styles.page} ${adding ? styles.adding : ""}`}
    >
      <div
        ref={hero}
        inert={adding}
        className={`${styles.hero} ${hasMultipleSizes ? styles.sizeHero : ""} ${ingredientOptions.length ? styles.customizableHero : ''}`}
      >
        {!!ingredientOptions.length && <ToppingStudio key={`${id}:${menuVersion}`} heroId={heroId} name={pizza.name} image={image} baseImage={pizza.toppingBaseImageUrl} options={ingredientOptions} changes={ingredientChanges} onChange={changes => setIngredientState({ id, changes })} language={language} scale={.86 + selectedIndex / Math.max(1, sizeOptions.length - 1) * .22} />}
        {hasMultipleSizes ? (
          <>
            <div className={styles.pizzaStage} hidden={!!ingredientOptions.length}>
              <PageHero id={ingredientOptions.length ? `inactive-${heroId}` : heroId}>
                <div
                  className={`${styles.sizedPizza} t-resize`}
                  style={{
                    width: `${56 + (selectedIndex / Math.max(1, sizeOptions.length - 1)) * 16}cqw`,
                    height: `${56 + (selectedIndex / Math.max(1, sizeOptions.length - 1)) * 16}cqw`,
                    rotate: `${(selectedIndex - 1) * 12}deg`,
                  }}
                >
                  <ProductImage
                    src={resolveProductImage(pizza)}
                    alt={pizza.name}
                    className={styles.pizzaSizeImage}
                  />
                </div>
              </PageHero>
            </div>
            <div className={styles.sizeOrbit} role="radiogroup" aria-label={language === "de" ? "Pizzagröße" : "Pizza size"}>
              {sizeOptions.map((size, index) => {
                const angle = Math.PI * (0.25 + 0.5 * index / (sizeOptions.length - 1));
                const short = /^(small|klein|s)$/i.test(size.label) ? "S" : /^(medium|mittel|m)$/i.test(size.label) ? "M" : /^(large|groß|l)$/i.test(size.label) ? "L" : size.label;
                return <label key={size.id} className={styles.sizeOption} style={{left: `${50 - 50 * Math.cos(angle)}%`, top: `${50 + 50 * Math.sin(angle)}%`}} title={`${size.label} · ${new Intl.NumberFormat(locale, currencyFormat).format(size.price)}`}>
                  <input type="radio" name={sizeGroupId} checked={selectedSize?.id === size.id} disabled={adding} aria-label={size.label} onChange={() => { setSizeChoice({pizzaId: id, sizeId: size.id}); setSelections([]); }} />
                  <span>{short}</span>
                </label>;
              })}
            </div>
          </>
        ) : !ingredientOptions.length ? (
          <PageHero id={heroId}>
            <ProductImage
              src={image}
              alt={pizza.name}
              className={styles.heroImage}
            />
          </PageHero>
        ) : null}
        <FlowReveal variant="detail">
          <ScrollHeader className={styles.header}>
            <IconBadgeButton
              aria-label={fromFeatured ? "Back to home" : "Back to menu"}
              href={fromFeatured ? "/home/" : "/menu/"}
              className={styles.iconButton}
            >
              <ChevronLeft size={23} />
            </IconBadgeButton>
            <span>Details</span>
            <IconBadgeButton
              aria-label={
                fav ? `Remove ${pizza.name} from saved` : `Save ${pizza.name}`
              }
              aria-pressed={fav}
              onPress={() => toggleFavorite(favoriteId)}
              className={styles.iconButton}
            >
              <Bookmark size={23} fill={fav ? "currentColor" : "none"} />
            </IconBadgeButton>
          </ScrollHeader>
        </FlowReveal>
        {discountPercent !== null && (
          <div className={styles.discountFlag}>
            <PercentageCircle size={26} aria-hidden="true" />
            <SlidingNumber
              value={discountPercent}
              locale={locale}
              suffix={language === "de" ? "% RABATT" : "% OFF"}
            />
          </div>
        )}
      </div>
        <section
          className={styles.sheet}
          aria-labelledby="pizza-title"
          inert={adding}
        >
          <svg
            className={styles.sheetCurve}
            viewBox="0 0 558 144"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M0 144 V132 C0 89 22 72 72 72 H220 C272 72 273 0 342 0 H486 C537 0 558 16 558 72 V144 Z"
              fill="currentColor"
            />
          </svg>
          <FlowReveal variant="detail" step={2}><div className={styles.delivery}>
            <div
              className={styles.reviews}
              aria-label={rating === null ? (language === "de" ? "Noch keine Bewertungen" : "No reviews yet") : undefined}
            >
              {rating !== null && <><Star size={18} aria-hidden="true" />
                <SlidingNumber
                  value={rating}
                  locale={locale}
                  format={{
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }}
                />
              </>}
              <span className={styles.reviewCount}>
                {reviewCount !== null && <>({
                  <SlidingNumber
                    value={reviewCount}
                    locale={locale}
                    format={{ notation: "compact", maximumFractionDigits: 1 }}
                  />
                } {language === "de" ? "Bewertungen" : "reviews"})</>}
                {reviewCount === null && (language === "de" ? "Noch keine Bewertungen" : "No reviews yet")}
              </span>
            </div>
          </div></FlowReveal>
          <FlowReveal variant="detail" step={3}>
            <h1 id="pizza-title" className={styles.title}>
              {pizza.name}
            </h1>
          </FlowReveal>
          <p className={styles.allergens}>
            <strong>{language === "de" ? "Allergene:" : "Allergens:"}</strong>{" "}
            {pizza.allergens?.length
              ? pizza.allergens.join(", ")
              : language === "de"
                ? "Bitte frage unser Team nach aktuellen Allergeninformationen."
                : "Please ask our team for current allergen information."}
          </p>
          <FlowReveal variant="detail" step={4}>
            <div className={styles.price}>
              <SlidingNumber
                value={displayPrice}
                locale={locale}
                format={currencyFormat}
              />
            </div>
          </FlowReveal>
          <FlowReveal variant="detail" step={5}>
            <PizzaDescription key={description} text={description} language={language} />
          </FlowReveal>
          <FlowReveal variant="detail" step={6}>
            <dl className={styles.facts}>
              <div className={styles.fact}>
                <span className={styles.factIcon}>
                  <Clock size={22} aria-hidden="true" />
                </span>
                <div>
                  <dt>
                    {language === "de" ? "Zubereitungszeit" : "Cooking Time"}
                  </dt>
                  <dd>{cookingTime}</dd>
                </div>
              </div>
              <div className={styles.fact}>
                <span className={styles.factIcon}>
                  <TakeoutFood size={22} aria-hidden="true" />
                </span>
                <div>
                  <dt>{language === "de" ? "Kategorie" : "Food Category"}</dt>
                  <dd>{category}</dd>
                </div>
              </div>
            </dl>
          </FlowReveal>
          <ProductOptions
            hideSizes
            sizes={sizeOptions}
            sizeId={selectedSize?.id ?? ""}
            onSize={sizeId => { setSizeChoice({ pizzaId: id, sizeId }); setSelections([]); }}
            config={pizza.customization}
            selections={activeSelections}
            onSelections={(next) => setSelections(next)}
            language={language}
            disabled={adding}
          />
          <button
            type="button"
            className={styles.saveUsual}
            onClick={() => {
              const size = /small|klein|^s$/i.test(selectedSize?.label ?? "") ? "small" : /large|groß|^l$/i.test(selectedSize?.label ?? "") ? "large" : "medium";
              setUsualSaved(saveUsualPizza({ pizzaId: pizza.pizzaId ?? pizza.id, name: pizza.name, size, extras: ingredientChanges.map((change) => change.ingredientId), variantId: pizza.customization ? selectedSize?.id : undefined, selections: activeSelections, label: [selectedSize?.label, ...options.labels, ...ingredientLabels].filter(Boolean).join(" · ") }));
            }}
          >
            {usualSaved ? (language === "de" ? "Übliche Auswahl gespeichert" : "Usual saved") : (language === "de" ? "Als meine übliche Auswahl speichern" : "Save as my usual")}
          </button>
          <span className="sr-only" role="status" aria-live="polite">{usualSaved ? (language === "de" ? "Übliche Auswahl gespeichert" : "Usual saved") : ""}</span>
          {!options.valid && (
            <p className={styles.choiceHint} role="status">
              {language === "de"
                ? "Bitte wähle die erforderlichen Optionen."
                : "Choose the required options to add your pizza."}
            </p>
          )}
          <PizzaComments id={id} language={language} rating={rating} reviewCount={reviewCount} />
        </section>
      <AddToCart
        key={id}
        hero={hero}
        onAnimating={setAdding}
        valid={options.valid && !isLoading}
        item={{
          menuItemId: pizza.id,
          menuVersion,
          name: pizza.name,
          variantId: pizza.customization ? selectedSize?.id : undefined,
          selections: pizza.customization ? activeSelections : undefined,
          selectionLabels: [
            selectedSize?.label ?? "",
            ...options.labels,
            ...ingredientLabels,
          ].filter(Boolean),
          size:
            !pizza.customization && (selectedSize?.id === "small" || selectedSize?.id === "large")
              ? selectedSize.id
              : "medium",
          extras: [],
          ingredientChanges,
          unitPrice: displayPrice,
          image,
        }}
      />
    </AppFrame>
  );
}
