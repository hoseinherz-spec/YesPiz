'use client';

import { Button } from '@heroui/react';
import { MapPin } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import {
  AccountField,
  AccountNotice,
  AccountScreen,
} from '@/components/AccountScreen';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const LABELS = [
  { value: 'Home', key: 'address.homeLabel', icon: '🏠' },
  { value: 'Work', key: 'address.workLabel', icon: '🏢' },
  { value: 'Other', key: 'address.otherLabel', icon: '📍' },
] as const;

export default function AddAddressPage() {
  const router = useRouter();
  const { t, hydrated, authed, createAddress } = useApp();
  const search = useSyncExternalStore(
    () => () => undefined,
    () => window.location.search,
    () => '',
  );
  const source = new URLSearchParams(search).get('from');
  const returnPath = source === 'checkout' ? '/checkout/' : '/settings/';
  const [label, setLabel] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Munich');
  const [zipcode, setZipcode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!authed) {
      const next = `/addresses/new/?from=${source === 'checkout' ? 'checkout' : 'settings'}`;
      router.replace(`/login/?next=${encodeURIComponent(next)}`);
    }
  }, [authed, hydrated, router, source]);

  const save = async () => {
    setError(null);
    setStatus(null);
    if (!street.trim() || !city.trim()) {
      setError(t('address.required'));
      return;
    }
    if (!authed) {
      router.push('/login/?next=/addresses/new/');
      return;
    }
    setSaving(true);
    try {
      await createAddress({
        label,
        street: street.trim(),
        city: city.trim(),
        zipcode: zipcode.trim() || undefined,
      });
      setStatus(t('address.success'));
      window.setTimeout(() => router.replace(returnPath), 650);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('login.errorGeneric'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountScreen
      title={t('address.newTitle')}
      subtitle={t('address.subtitle')}
      backHref={returnPath}
    >
      <div className="relative mb-6 h-48 overflow-hidden rounded-[30px] border border-border bg-[var(--charcoal)]">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(35deg,transparent_45%,#313139_46%,#313139_54%,transparent_55%),linear-gradient(110deg,transparent_45%,#313139_46%,#313139_54%,transparent_55%)] [background-size:72px_72px]" />
        <div className="absolute inset-x-[-10%] top-1/2 h-8 -rotate-6 bg-[color-mix(in_oklab,var(--accent)_42%,#2d6f8f)]" />
        <span className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-background bg-accent text-accent-foreground shadow-lg">
          <MapPin size={24} />
        </span>
      </div>

      {error ? <AccountNotice tone="danger">{error}</AccountNotice> : null}
      {status ? <AccountNotice tone="success">{status}</AccountNotice> : null}

      <form
        className="mt-4 grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <AccountField
          label={t('address.street')}
          name="street"
          autoComplete="street-address"
          placeholder={t('address.street')}
          value={street}
          onChange={(event) => setStreet(event.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <AccountField
            label={t('address.city')}
            name="city"
            autoComplete="address-level2"
            placeholder={t('address.city')}
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="px-4"
          />
          <AccountField
            label={t('address.zip')}
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder={t('address.zip')}
            value={zipcode}
            onChange={(event) => setZipcode(event.target.value)}
            className="px-4"
          />
        </div>

        <fieldset>
          <legend className="mb-3 text-[20px] font-bold text-foreground">
            {t('address.labelAs')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {LABELS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={label === option.value ? 'primary' : 'secondary'}
                onPress={() => setLabel(option.value)}
                className={cn('h-13 rounded-full px-4 font-semibold')}
              >
                <span aria-hidden="true">{option.icon}</span>
                {t(option.key)}
              </Button>
            ))}
          </div>
        </fieldset>

        <Button
          type="button"
          variant="primary"
          isPending={saving}
          isDisabled={saving}
          onPress={() => void save()}
          className={cn(hx.btnPrimary, 'mt-4')}
        >
          {t('address.action')}
        </Button>
      </form>
    </AccountScreen>
  );
}
