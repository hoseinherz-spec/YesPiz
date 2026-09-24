"use client";

import { Avatar, Button, Card, buttonVariants } from "@heroui/react";
import { careClient, type PublicPizzaComment } from "@repo/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./PizzaReviews.module.css";
import { ReviewsSkeleton } from "./PizzaSkeletons";
import { ProductImage } from "@/features/catalog/components/ProductImage/ProductImage";

export function ReviewStar({ fill = 1 }: { fill?: number }) {
  return (
    <span className={styles.star} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z" />
      </svg>
      <span style={{ width: `${Math.max(0, Math.min(1, fill)) * 100}%` }}>
        <svg viewBox="0 0 24 24">
          <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z" />
        </svg>
      </span>
    </span>
  );
}

function ReviewerAvatar({ de }: { de: boolean }) {
  return (
    <Avatar
      className={styles.avatar}
      aria-label={de ? "Verifizierter Kunde" : "Verified customer"}
    >
      <Avatar.Fallback>✓</Avatar.Fallback>
    </Avatar>
  );
}

function ReviewCard({
  row,
  de,
  now,
}: {
  row: PublicPizzaComment;
  de: boolean;
  now: number;
}) {
  const date = new Date(row.publishedAt);
  const validDate = Number.isFinite(date.getTime());
  const days = validDate
    ? Math.max(0, Math.floor((now - date.getTime()) / 86400000))
    : null;
  const time =
    days === null
      ? null
      : new Intl.RelativeTimeFormat(de ? "de" : "en", {
          numeric: "auto",
        }).format(-days, "day");
  return (
    <Card className={styles.card}>
      <Card.Header className={styles.cardHeader}>
        <ReviewerAvatar de={de} />
        <Card.Title className={styles.author}>
          {de ? "Verifizierter Kunde" : "Verified customer"}
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <blockquote className={styles.quote}>{row.text}</blockquote>
      </Card.Content>
      {time && (
        <Card.Footer className={styles.cardFooter}>
          <time
            className={styles.date}
            dateTime={date.toISOString()}
            title={date.toLocaleDateString(de ? "de-DE" : "en-GB")}
          >
            {time}
          </time>
        </Card.Footer>
      )}
    </Card>
  );
}

export function PizzaComments({
  id,
  language,
  rating = null,
  reviewCount = null,
  full = false,
}: {
  id: string;
  language: string;
  rating?: number | null;
  reviewCount?: number | null;
  full?: boolean;
}) {
  const [result, setResult] = useState<{
    id: string;
    rows: PublicPizzaComment[];
    loadedAt: number;
  } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const de = language === "de";
  useEffect(() => {
    let live = true;
    careClient
      .comments(id)
      .then((rows) => {
        if (live) {
          setResult({ id, rows, loadedAt: Date.now() });
          setFailure(null);
        }
      })
      .catch(() => {
        if (live) setFailure(id);
      });
    return () => {
      live = false;
    };
  }, [id, retry]);
  const rows = result?.id === id ? result.rows : null;
  const error = failure === id;
  const number = new Intl.NumberFormat(de ? "de-DE" : "en-GB");

  return (
    <section
      className={full ? styles.full : styles.preview}
      aria-label={de ? "Bewertungen" : "Reviews"}
    >
      {!full && (
        <>
          <div className={styles.sectionHeader}>
            <h2>{de ? "Bewertungen" : "Rating & Reviews"}</h2>
            <Link
              className={`${buttonVariants({ variant: "ghost", size: "sm" })} ${styles.seeAll}`}
              href={`/menu/${encodeURIComponent(id)}/reviews/`}
            >
              {de ? "Alle ansehen" : "See all"}
            </Link>
          </div>
          <div className={styles.summary}>
            {rating !== null && (
              <span className={styles.ratingPill} aria-label={`${rating} / 5`}>
                <ReviewStar />
                <strong>{rating.toFixed(1)}</strong>
              </span>
            )}
            <p>
              {reviewCount !== null ? (
                <>
                  {de ? "Von " : "From "}
                  <strong>{number.format(reviewCount)}</strong>{" "}
                  {de ? "Bewertungen" : "reviews"}
                </>
              ) : de ? (
                "Kundenstimmen"
              ) : (
                "Customer reviews"
              )}
            </p>
            {!!rows?.length && (
              <div className={styles.avatars} aria-hidden="true">
                {rows.slice(0, 3).map((row) => (
                  <ReviewerAvatar key={row.id} de={de} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
      {error ? (
        <div className={styles.state} role="status">
          <p>
            {de
              ? "Bewertungen konnten nicht geladen werden."
              : "Unable to load reviews."}
          </p>
          <Button
            variant="secondary"
            onPress={() => {
              setFailure(null);
              setRetry((value) => value + 1);
            }}
          >
            {de ? "Erneut versuchen" : "Retry"}
          </Button>
        </div>
      ) : rows === null ? (
        <ReviewsSkeleton full={full} />
      ) : rows.length === 0 ? (
        <div className={styles.state}>
          <ProductImage src="/images/pizzacraft/Pizza Box.png" alt="" className={styles.emptyImage} />
          <p>
            {de
              ? "Noch keine veröffentlichten Bewertungen."
              : "No published reviews yet."}
          </p>
          <span>
            {de
              ? "Hier erscheinen freigegebene Stimmen aus verifizierten Bestellungen."
              : "Approved reviews from verified orders will appear here."}
          </span>
        </div>
      ) : (
        <div
          className={full ? styles.list : styles.carousel}
          tabIndex={full ? undefined : 0}
          role={full ? undefined : "region"}
          aria-label={
            full
              ? undefined
              : de
                ? "Kundenbewertungen, horizontal scrollen"
                : "Customer reviews, scroll horizontally"
          }
        >
          {(full ? rows : rows.slice(0, 3)).map((row) => (
            <ReviewCard key={row.id} row={row} de={de} now={result!.loadedAt} />
          ))}
        </div>
      )}
      {!!rows?.length && (
        <p className={styles.disclosure}>
          {de
            ? "Mit Erlaubnis nach Prüfung veröffentlicht."
            : "Shared with permission after review."}
        </p>
      )}
    </section>
  );
}
