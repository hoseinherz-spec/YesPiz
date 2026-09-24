"use client";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@heroui/react";
import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";

function SaveForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { language } = useApp();
  const de = language === "de";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (!stripe || !elements || busy) return;
        setBusy(true);
        setError("");
        try {
          const result = await stripe.confirmSetup({
            elements,
            redirect: "if_required",
            confirmParams: {
              return_url: `${window.location.origin}/profile/payment-methods/`,
            },
          });
          if (result.error)
            setError(result.error.message ?? "Unable to save card.");
          else if (result.setupIntent?.status === "succeeded") await onSaved();
          else
            setError(
              de
                ? "Die Karte wird noch geprüft. Bitte erneut versuchen."
                : "Card verification is still processing. Please try again.",
            );
        } catch {
          setError(
            de
              ? "Karte konnte nicht gespeichert werden."
              : "Unable to save card. Please try again.",
          );
        } finally {
          setBusy(false);
        }
      }}
      className="grid gap-4 rounded-3xl bg-surface-secondary p-4"
    >
      <PaymentElement />
      <p className="text-xs leading-5 text-muted">
        {de
          ? "Mit „Karte speichern“ erlaubst du Yespiz, diese Karte für zukünftige Zahlungen beim Checkout bei Stripe zu speichern. Es erfolgt keine Zahlung."
          : "By choosing Save card, you allow Yespiz to save this card with Stripe for future checkout payments. You won’t be charged now."}
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button
        type="submit"
        isDisabled={!stripe || !elements || busy}
        isPending={busy}
      >
        {de ? "Karte speichern" : "Save card"}
      </Button>
      <Button variant="ghost" isDisabled={busy} onPress={onCancel}>
        {de ? "Abbrechen" : "Cancel"}
      </Button>
    </form>
  );
}

export function StripeSaveCard({
  clientSecret,
  onSaved,
  onCancel,
}: {
  clientSecret: string;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const { mode } = useApp();
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripe = useMemo(() => (key ? loadStripe(key) : null), [key]);
  if (!stripe) return <p role="alert">Card saving is currently unavailable.</p>;
  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: { theme: mode === "dark" ? "night" : "stripe" },
      }}
    >
      <SaveForm onSaved={onSaved} onCancel={onCancel} />
    </Elements>
  );
}
