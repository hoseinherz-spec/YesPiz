"use client";
import { AppText } from "@/components/Text";

import { useEffect, useState } from "react";
import { careClient, type PublicPizzaComment } from "@repo/api";
export function PizzaComments({
  id,
  language,
}: {
  id: string;
  language: string;
}) {
  const [result, setResult] = useState<{
    id: string;
    rows: PublicPizzaComment[];
  } | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const de = language === "de";
  useEffect(() => {
    let live = true;
    careClient
      .comments(id)
      .then((rows) => {
        if (live) {
          setResult({ id, rows });
          setError("");
        }
      })
      .catch(() => {
        if (live)
          setError(
            de
              ? "Kommentare konnten nicht geladen werden."
              : "Unable to load comments.",
          );
      });
    return () => {
      live = false;
    };
  }, [id, retry, de]);
  const rows = result?.id === id ? result.rows : null;
  return (
    <section
      className="mx-4 my-7 rounded-3xl bg-card p-5"
      aria-labelledby="pizza-comments-title"
    >
      <AppText as="h2" id="pizza-comments-title" className="text-xl font-semibold">
        {de ? "Stimmen zu dieser Pizza" : "What customers say"}
      </AppText>
      <AppText as="p" className="mt-2 text-xs leading-5 text-muted">
        {de
          ? "Ausgewählte Kommentare aus verifizierten Bestellungen, mit Erlaubnis und nach Prüfung veröffentlicht."
          : "Selected comments from verified orders, shared with permission after review."}
      </AppText>
      {error ? (
        <AppText as="p" role="status" className="mt-4 text-sm">
          {error}{" "}
          <button
            className="underline"
            onClick={() => setRetry((value) => value + 1)}
          >
            {de ? "Erneut versuchen" : "Retry"}
          </button>
        </AppText>
      ) : !rows ? (
        <AppText as="p" role="status" className="mt-4 text-sm">
          {de ? "Wird geladen…" : "Loading comments…"}
        </AppText>
      ) : !rows.length ? (
        <AppText as="p" className="mt-4 text-sm text-muted">
          {de
            ? "Noch keine veröffentlichten Kommentare."
            : "No published comments yet."}
        </AppText>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {rows.map((row) => (
            <figure key={row.id} className="py-4">
              <blockquote className="whitespace-pre-wrap break-words text-sm leading-6">
                {row.text}
              </blockquote>
              <figcaption className="mt-2 text-xs text-muted">
                {de ? "Verifizierte Bestellung" : "Verified order"} ·{" "}
                {new Date(row.publishedAt).toLocaleDateString(
                  de ? "de-DE" : "en-GB",
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
