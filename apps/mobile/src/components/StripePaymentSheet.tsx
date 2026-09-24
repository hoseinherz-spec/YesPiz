"use client";
import { Form } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import { Typography } from "@heroui/react";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { paymentsClient, type SavedCard } from "@repo/api";

import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";
import { SavedPaymentCard } from "./SavedPaymentCard";
import cardStyles from "./SavedPaymentCard.module.css";

type Props = {
  clientSecret: string;
  amountLabel: string;
  processingLabel: string;
  payLabel: string;
  cancelLabel: string;
  errorFallback: string;
  onCancel: () => void;
  onSuccess: () => void | Promise<void>;
};

function ConfirmPayment({
  clientSecret,
  amountLabel,
  processingLabel,
  payLabel,
  cancelLabel,
  errorFallback,
  onCancel,
  onSuccess,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const { accessToken, language } = useApp();
  const [saved, setSaved] = useState<{
    token: string;
    cards: SavedCard[];
  } | null>(null);
  const [selectedCard, setSelectedCard] = useState("");
  useEffect(() => {
    let live = true;
    if (accessToken)
      void paymentsClient
        .savedCards({ accessToken })
        .then((cards) => {
          if (live) setSaved({ token: accessToken, cards });
        })
        .catch(() => {
          /* New-card checkout remains available. */
        });
    return () => {
      live = false;
    };
  }, [accessToken]);
  const cards = saved?.token === accessToken ? saved.cards : [];
  const selected = cards.find((card) => card.id === selectedCard)?.id;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (selected) {
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: selected,
        });
        if (result.error) setError(result.error.message ?? errorFallback);
        else if (result.paymentIntent?.status === "succeeded")
          await onSuccess();
        else
          setError(
            "Your payment is still processing. Please try again shortly.",
          );
        return;
      }
      const submitted = await elements.submit();
      if (submitted.error) {
        setError(submitted.error.message ?? errorFallback);
        return;
      }
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: { return_url: window.location.href },
      });
      if (result.error) {
        setError(result.error.message ?? errorFallback);
        return;
      }
      if (result.paymentIntent?.status === "succeeded") {
        await onSuccess();
      } else {
        setError("Your payment is still processing. Please try again shortly.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : errorFallback);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Form
      className="rounded-[28px] border border-border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void confirm();
      }}
    >
      {!!cards.length && (
        <fieldset className="mb-4 grid min-w-0 gap-5">
          <legend className="mb-2 text-sm font-semibold">
            {language === "de" ? "Gespeicherte Karte" : "Saved card"}
          </legend>
          {cards.map((card) => (
            <label
              key={card.id}
              className={cardStyles.choice}
            >
              <input
                type="radio"
                name="saved-card"
                value={card.id}
                checked={selectedCard === card.id}
                disabled={busy}
                onChange={() => setSelectedCard(card.id)}
              />
              <SavedPaymentCard card={card} language={language} />
            </label>
          ))}
          <label className="flex items-center gap-3 p-3 text-sm">
            <input
              type="radio"
              name="saved-card"
              value=""
              checked={!selected}
              disabled={busy}
              onChange={() => setSelectedCard("")}
            />
            {language === "de"
              ? "Andere Zahlungsmethode"
              : "Another payment method"}
          </label>
        </fieldset>
      )}
      <div hidden={Boolean(selected)}>
        <ExpressCheckoutElement
          options={{
            paymentMethods: {
              applePay: "auto",
              googlePay: "auto",
              link: "never",
              amazonPay: "never",
              paypal: "never",
            },
          }}
          onConfirm={() => {
            void confirm();
          }}
        />
        <div className="mt-4">
          <PaymentElement
            options={{
              layout: "tabs",
              paymentMethodOrder: ["card", "klarna"],
              wallets: { applePay: "never", googlePay: "never" },
            }}
          />
        </div>
      </div>
      {error ? (
        <Typography type="body-sm" className="mt-3 text-danger" role="alert">
          {error}
        </Typography>
      ) : null}
      <div className="mt-5 flex flex-col gap-2.5">
        <FormButton
          variant="ghost"
          aria-busy={busy}
          isDisabled={!stripe || !elements || busy}
          type="submit"
          className={cn(
            hx.btnPrimary,
            "h-14 cursor-pointer disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          )}
        >
          {busy ? processingLabel : payLabel.replace("{amount}", amountLabel)}
        </FormButton>
        <FormButton
          variant="ghost"
          isDisabled={busy}
          type="button"
          onPress={onCancel}
          className="h-11 cursor-pointer rounded-full text-muted disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-focus"
        >
          {cancelLabel}
        </FormButton>
      </div>
    </Form>
  );
}

export function StripePaymentSheet(props: Props) {
  const { mode } = useApp();
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );
  const options = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret: props.clientSecret,
      appearance: { theme: mode === "dark" ? "night" : "stripe" },
    }),
    [props.clientSecret, mode],
  );

  if (!publishableKey || !stripePromise) return null;

  return (
    <Elements stripe={stripePromise} options={options}>
      <ConfirmPayment {...props} />
    </Elements>
  );
}
