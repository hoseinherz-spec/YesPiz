"use client";

import { Typography } from "@heroui/react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { useMemo, useState } from "react";

import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

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
  amountLabel,
  processingLabel,
  payLabel,
  cancelLabel,
  errorFallback,
  onCancel,
  onSuccess,
}: Omit<Props, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(null);
    try {
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
    <form
      className="rounded-[28px] border border-border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void confirm();
      }}
    >
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? (
        <Typography type="body-sm" className="mt-3 text-danger" role="alert">
          {error}
        </Typography>
      ) : null}
      <div className="mt-5 flex flex-col gap-2.5">
        <button
          aria-busy={busy}
          disabled={!stripe || !elements || busy}
          type="submit"
          className={cn(
            hx.btnPrimary,
            "h-14 cursor-pointer disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          )}
        >
          {busy ? processingLabel : payLabel.replace("{amount}", amountLabel)}
        </button>
        <button
          disabled={busy}
          type="button"
          onClick={onCancel}
          className="h-11 cursor-pointer rounded-full text-muted disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-focus"
        >
          {cancelLabel}
        </button>
      </div>
    </form>
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
