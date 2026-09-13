"use client";
import { AppText } from "@/components/Text";

import { FormScope, Input, Form, RadioField, TextArea } from "@repo/ui/forms";

import { careClient, type FeedbackInput } from "@repo/api";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { hx } from "@/lib/heroui-classes";
const dimensions = ["taste", "temperature", "packaging", "delivery"] as const;
export default function FeedbackPage() {
  const { accessToken, language } = useApp();
  const de = language === "de";
  const id = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("order") ?? "",
    () => "",
  );
  const [state, setState] = useState<{
    eligible: boolean;
    submitted: boolean;
    allowPublication?: boolean;
  } | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [again, setAgain] = useState<boolean | null>(null);
  const [allowPublication, setAllowPublication] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    if (!accessToken || !id) return;
    careClient
      .feedbackState(id, { accessToken })
      .then((value) => {
        if (live) {
          setState(value);
          setError("");
        }
      })
      .catch((e) => {
        if (live)
          setError(e instanceof Error ? e.message : "Unable to load feedback.");
      });
    return () => {
      live = false;
    };
  }, [accessToken, id, reload]);
  async function submit() {
    if (
      !accessToken ||
      !dimensions.every((key) => scores[key]) ||
      again === null
    )
      return;
    setBusy(true);
    setError("");
    try {
      await careClient.feedback(
        id,
        {
          taste: scores.taste,
          temperature: scores.temperature,
          packaging: scores.packaging,
          delivery: scores.delivery,
          wouldOrderAgain: again,
          comment,
          allowPublication,
        } as FeedbackInput,
        { accessToken },
      );
      setState({ eligible: true, submitted: true, allowPublication });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function changePermission(value: boolean) {
    if (!accessToken || !id) return;
    setBusy(true);
    setError("");
    try {
      await careClient.permission(id, value, { accessToken });
      setState((previous) =>
        previous ? { ...previous, allowPublication: value } : previous,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update permission.");
    } finally {
      setBusy(false);
    }
  }
  const labels = de
    ? ["Geschmack", "Temperatur", "Verpackung", "Lieferung"]
    : ["Taste", "Temperature", "Packaging", "Delivery"];
  return (
    <FormScope>
      {
        <AppFrame className="reference-screen">
          <ScreenHeader
            title={
              de ? "Deine Pizza, dein Feedback" : "Your pizza, your feedback"
            }
          />
          <AppText as="p" className="mt-3 text-sm leading-6 text-muted">
            {de
              ? "Deine Bewertungen bleiben intern. Deinen Kommentar veröffentlichen wir nur mit deiner Erlaubnis und nach Prüfung."
              : "Your scores stay internal. Your comment is shared only with your permission and after review."}
          </AppText>
          {error && (
            <div role="alert" className="my-4 text-danger">
              {error}{" "}
              <Button
                variant="secondary"
                onPress={() => setReload((n) => n + 1)}
              >
                Retry
              </Button>
            </div>
          )}
          {!accessToken ? (
            <Link href="/login/">
              {de ? "Bitte anmelden" : "Sign in to continue"}
            </Link>
          ) : !id ? (
            <section className="my-8 rounded-3xl bg-surface-secondary p-6">
              <p>
                {de
                  ? "Wähle eine gelieferte Bestellung für dein Feedback."
                  : "Choose a delivered order to leave feedback."}
              </p>
              <Link
                href="/orders/"
                className="mt-4 inline-block font-semibold underline"
              >
                {de ? "Bestellungen ansehen" : "View orders"}
              </Link>
            </section>
          ) : !state ? (
            <AppText as="p" className="my-8" role="status">
              {de ? "Bestellung wird geladen…" : "Loading your order…"}
            </AppText>
          ) : state.submitted ? (
            <section className="my-8 rounded-[28px] bg-surface-secondary p-6">
              <AppText as="h2" className="text-2xl font-bold">
                {de
                  ? "Danke für dein Feedback"
                  : "Thanks for helping us improve"}
              </AppText>
              <AppText as="p" className="mt-3 text-sm text-muted">
                {de
                  ? "Wir nutzen es, um jede Pizza besser zu machen."
                  : "We use your feedback to improve every pizza."}
              </AppText>
              <Input
                label={
                  <>
                    {de
                      ? "Mein Kommentar darf nach erneuter Prüfung anonym veröffentlicht werden. Deaktivieren entfernt ihn von der Pizzaseite."
                      : "Allow my comment to be published anonymously after review. Turning this off removes it from the pizza page."}
                  </>
                }
                wrapperClassName="mt-5 flex items-start gap-3 text-sm leading-6"
                type="checkbox"
                checked={state.allowPublication ?? false}
                disabled={busy}
                onChange={(e) => void changePermission(e.target.checked)}
              />
              <Link
                className="mt-6 inline-block font-semibold underline"
                href="/orders/"
              >
                {de ? "Zu Bestellungen" : "Back to orders"}
              </Link>
            </section>
          ) : !state.eligible ? (
            <AppText as="p" className="my-8">
              {de
                ? "Feedback ist nach der Lieferung verfügbar."
                : "Feedback is available after delivery."}
            </AppText>
          ) : (
            <Form
              className="mt-6 space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              {dimensions.map((key, index) => (
                <RadioField
                  key={key}
                  name={key}
                  className="feedback-score"
                  required
                  label={labels[index]}
                  value={scores[key] ? String(scores[key]) : ""}
                  onChange={(v) =>
                    setScores((old) => ({ ...old, [key]: Number(v) }))
                  }
                  options={[1, 2, 3, 4, 5].map((v) => ({
                    id: String(v),
                    label: String(v),
                  }))}
                />
              ))}
              <RadioField
                name="wouldOrderAgain"
                required
                label={
                  de ? "Würdest du wieder bestellen?" : "Would you order again?"
                }
                value={again === null ? "" : String(again)}
                onChange={(v) => setAgain(v === "true")}
                options={[
                  { id: "true", label: de ? "Ja" : "Yes" },
                  { id: "false", label: de ? "Nein" : "No" },
                ]}
              />
              <TextArea
                label={
                  <>
                    {de
                      ? "Was können wir verbessern? (optional)"
                      : "What could we improve? (optional)"}
                  </>
                }
                wrapperClassName="block text-sm font-medium"
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-3 min-h-28 w-full rounded-2xl bg-field-background p-4 text-foreground focus-visible:outline-focus"
              />
              <Input
                label={
                  <>
                    {de
                      ? "Mein Kommentar oder ein Auszug darf nach Prüfung anonym auf der Pizzaseite erscheinen. Meine Bewertungen bleiben privat."
                      : "Yespizz may publish my comment or an excerpt anonymously on this pizza’s page after review. My scores stay private."}
                  </>
                }
                wrapperClassName="flex items-start gap-3 text-sm leading-6"
                type="checkbox"
                checked={allowPublication}
                onChange={(event) => setAllowPublication(event.target.checked)}
                className="mt-1"
              />
              <Button
                type="submit"
                fullWidth
                className={hx.btnPrimary}
                isDisabled={
                  busy ||
                  again === null ||
                  !dimensions.every((key) => scores[key])
                }
              >
                {busy
                  ? de
                    ? "Wird gesendet…"
                    : "Sending…"
                  : de
                    ? "Feedback senden"
                    : "Send feedback"}
              </Button>
              <Link
                className="block text-center text-sm underline"
                href={`/help/?order=${encodeURIComponent(id)}`}
              >
                {de
                  ? "Brauchst du Hilfe zu dieser Bestellung?"
                  : "Need help with this order?"}
              </Link>
            </Form>
          )}
        </AppFrame>
      }
    </FormScope>
  );
}
