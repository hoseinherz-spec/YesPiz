'use client';

import { Button, Typography } from '@heroui/react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type StripeElementsOptions } from '@stripe/stripe-js';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

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
}: Omit<Props, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (result.error) {
        setError(result.error.message ?? errorFallback);
        return;
      }
      if (result.paymentIntent?.status === 'succeeded') {
        await onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : errorFallback);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-border bg-card p-5">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error ? (
        <Typography type="body-sm" className="mt-3 text-danger" role="alert">
          {error}
        </Typography>
      ) : null}
      <div className="mt-5 flex flex-col gap-2.5">
        <Button
          variant="primary"
          fullWidth
          isPending={busy}
          isDisabled={!stripe || !elements || busy}
          onPress={() => void confirm()}
          className={cn(hx.btnPrimary, 'h-14')}
        >
          {busy ? processingLabel : payLabel.replace('{amount}', amountLabel)}
        </Button>
        <Button variant="ghost" fullWidth onPress={onCancel} className="h-11 text-muted">
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}

export function StripePaymentSheet(props: Props) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );
  const options = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret: props.clientSecret,
      appearance: { theme: 'stripe' },
    }),
    [props.clientSecret],
  );

  if (!publishableKey || !stripePromise) return null;

  return (
    <Elements stripe={stripePromise} options={options}>
      <ConfirmPayment {...props} />
    </Elements>
  );
}
