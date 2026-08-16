'use client';

import { Button, Input, Label, TextField, Typography } from '@heroui/react';
import { CreditCard } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

type CardErrors = Partial<Record<'holder' | 'number' | 'expiry' | 'cvc', string>>;

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function passesLuhn(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13) return false;
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export default function NewPaymentCardPage() {
  const router = useRouter();
  const { t } = useApp();
  const [holder, setHolder] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errors, setErrors] = useState<CardErrors>({});

  const saveDemoCard = () => {
    const nextErrors: CardErrors = {};
    const cleanNumber = number.replace(/\D/g, '');
    const [monthString, yearString] = expiry.split('/');
    const month = Number(monthString);
    const year = Number(yearString);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const expired = year < currentYear || (year === currentYear && month < now.getMonth() + 1);

    if (holder.trim().length < 2) nextErrors.holder = t('card.errorHolder');
    if (!passesLuhn(cleanNumber)) nextErrors.number = t('card.errorNumber');
    if (!/^\d{2}\/\d{2}$/.test(expiry) || month < 1 || month > 12 || expired) {
      nextErrors.expiry = t('card.errorExpiry');
    }
    if (!/^\d{3,4}$/.test(cvc)) nextErrors.cvc = t('card.errorCvc');

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      sessionStorage.setItem(
        'yespizz_demo_card',
        JSON.stringify({ holder: holder.trim(), last4: cleanNumber.slice(-4) }),
      );
      sessionStorage.setItem('yespizz_payment_method', 'card');
    } catch {
      // The form still works as a validation demo when session storage is unavailable.
    }
    router.replace('/payment/');
  };

  const fieldClass = 'w-full';
  const inputClass = cn(hx.field, '!h-[72px] !rounded-[20px]');

  return (
    <AppFrame className="pb-[max(32px,env(safe-area-inset-bottom))]">
      <ScreenHeader title={t('card.title')} backHref="/payment/" />

      <div className="mb-7 flex items-center gap-3 rounded-[26px] bg-accent p-4 text-accent-foreground">
        <span className="flex size-12 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent-foreground)_10%,transparent)]">
          <CreditCard size={22} />
        </span>
        <div>
          <Typography type="h6" className="text-[16px] font-bold text-accent-foreground">
            {t('card.demoTitle')}
          </Typography>
          <Typography type="body-xs" className="text-[12px] font-medium text-[color-mix(in_oklab,var(--accent-foreground)_68%,transparent)]">
            {t('card.demoBody')}
          </Typography>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <TextField isInvalid={Boolean(errors.holder)} className={fieldClass} name="cardholder">
          <Label className="mb-2 block text-[12px] font-semibold text-muted">{t('card.holder')}</Label>
          <Input
            autoComplete="cc-name"
            value={holder}
            onChange={(event) => setHolder(event.target.value)}
            placeholder={t('card.holderPlaceholder')}
            className={inputClass}
          />
          {errors.holder ? <p className="mt-1.5 text-[12px] text-danger">{errors.holder}</p> : null}
        </TextField>

        <TextField isInvalid={Boolean(errors.number)} className={fieldClass} name="cardNumber">
          <Label className="mb-2 block text-[12px] font-semibold text-muted">{t('card.number')}</Label>
          <Input
            autoComplete="cc-number"
            inputMode="numeric"
            value={number}
            onChange={(event) => setNumber(formatCardNumber(event.target.value))}
            placeholder="4242 4242 4242 4242"
            className={inputClass}
          />
          {errors.number ? <p className="mt-1.5 text-[12px] text-danger">{errors.number}</p> : null}
        </TextField>

        <div className="grid grid-cols-2 gap-3">
          <TextField isInvalid={Boolean(errors.expiry)} className={fieldClass} name="expiry">
            <Label className="mb-2 block text-[12px] font-semibold text-muted">{t('card.expiry')}</Label>
            <Input
              autoComplete="cc-exp"
              inputMode="numeric"
              value={expiry}
              onChange={(event) => setExpiry(formatExpiry(event.target.value))}
              placeholder="MM/YY"
              className={cn(inputClass, '!px-4 text-center')}
            />
            {errors.expiry ? <p className="mt-1.5 text-[12px] text-danger">{errors.expiry}</p> : null}
          </TextField>
          <TextField isInvalid={Boolean(errors.cvc)} className={fieldClass} name="cvc">
            <Label className="mb-2 block text-[12px] font-semibold text-muted">{t('card.cvc')}</Label>
            <Input
              autoComplete="cc-csc"
              inputMode="numeric"
              value={cvc}
              onChange={(event) => setCvc(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              className={cn(inputClass, '!px-4 text-center')}
            />
            {errors.cvc ? <p className="mt-1.5 text-[12px] text-danger">{errors.cvc}</p> : null}
          </TextField>
        </div>
      </div>

      <Typography type="body-xs" className={cn(hx.caption, 'mt-5')}>
        {t('card.privacy')}
      </Typography>
      <Button
        variant="primary"
        fullWidth
        onPress={saveDemoCard}
        className={cn(hx.btnPrimary, 'mt-7')}
      >
        {t('card.action')}
      </Button>
    </AppFrame>
  );
}
