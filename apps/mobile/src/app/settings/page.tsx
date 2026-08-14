'use client';

import { Button, Card, Typography } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { LANGUAGES } from '@/constants/i18n';
import { useApp } from '@/context/AppContext';
import { LinkRow } from '@/features/settings/components/LinkRow';
import { PrefRow } from '@/features/settings/components/PrefRow';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const fieldClass =
  'w-full rounded-[14px] border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground outline-none placeholder:text-muted focus:border-accent';

function addressTitle(t: (key: string) => string, label: string) {
  const key = `address.${label.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? label : translated;
}

export default function SettingsPage() {
  const router = useRouter();
  const {
    t,
    mode,
    toggleMode,
    language,
    setLanguage,
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    createAddress,
    authed,
    pushEnabled,
    setPushEnabled,
    locationEnabled,
    setLocationEnabled,
    logout,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Munich');
  const [zipcode, setZipcode] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSaveAddress = async () => {
    setFormError(null);
    if (!authed) {
      router.push('/login/');
      return;
    }
    if (!street.trim()) return;
    setSaving(true);
    try {
      await createAddress({
        label: label.trim() || 'Home',
        street: street.trim(),
        city: city.trim() || 'Munich',
        zipcode: zipcode.trim() || undefined,
      });
      setShowForm(false);
      setStreet('');
      setZipcode('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppFrame>
      <ScreenHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <Typography type="body-xs" className={cn(hx.caption, 'mb-2')}>
        {t('settings.preferences')}
      </Typography>
      <Card className={cn(hx.card, 'mb-4 overflow-hidden !p-0')}>
        <Card.Content className="p-0">
          <PrefRow
            label={t('settings.darkMode')}
            control={
              <ThemeSwitch
                isSelected={mode === 'dark'}
                onChange={() => toggleMode()}
                aria-label={t('settings.darkMode')}
              />
            }
          />
          <PrefRow
            label={t('settings.push')}
            control={
              <ThemeSwitch
                isSelected={pushEnabled}
                onChange={setPushEnabled}
                aria-label={t('settings.push')}
              />
            }
          />
          <PrefRow
            label={t('settings.location')}
            control={
              <ThemeSwitch
                isSelected={locationEnabled}
                onChange={setLocationEnabled}
                aria-label={t('settings.location')}
              />
            }
            last
          />
        </Card.Content>
      </Card>

      <Typography type="body-xs" className={cn(hx.caption, 'mb-2')}>
        {t('settings.language')}
      </Typography>
      <div className="mb-4 flex flex-col gap-2">
        {LANGUAGES.map((lang) => {
          const active = language === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang.id)}
              className={cn(
                'flex items-center justify-between rounded-[18px] border px-4 py-3.5 bg-card',
                active ? 'border-accent' : 'border-border',
              )}
            >
              <Typography type="h6" className={hx.title}>
                {lang.label}
              </Typography>
              <span
                className={cn(
                  'h-5 w-5 rounded-full border-2',
                  active ? 'border-accent bg-accent' : 'border-border bg-transparent',
                )}
              />
            </button>
          );
        })}
      </div>

      <Typography type="body-xs" className={cn(hx.caption, 'mb-2')}>
        {t('settings.addresses')}
      </Typography>
      <div className="mb-2 flex flex-col gap-2">
        {addresses.map((addr) => {
          const active = selectedAddressId === addr.id;
          return (
            <button
              key={addr.id}
              type="button"
              onClick={() => setSelectedAddressId(addr.id)}
              className={cn(
                'rounded-[18px] border px-3 py-3 text-left bg-card',
                active ? 'border-accent' : 'border-border',
              )}
            >
              <Typography type="h6" className={hx.title}>
                {addressTitle(t, addr.label)}
              </Typography>
              <Typography type="body-sm" className={cn(hx.bodySm, 'mt-0.5')}>
                {addr.detail}
              </Typography>
            </button>
          );
        })}

        {showForm ? (
          <Card className={cn(hx.card, '!p-3')}>
            <Card.Content className="flex flex-col gap-2 p-0">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-muted">
                  {t('settings.addressLabel')}
                </span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-muted">
                  {t('settings.addressStreet')}
                </span>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={fieldClass}
                  placeholder="Maximilianstrasse 12"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-muted">
                    {t('settings.addressCity')}
                  </span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-muted">
                    {t('settings.addressZip')}
                  </span>
                  <input
                    value={zipcode}
                    onChange={(e) => setZipcode(e.target.value)}
                    className={fieldClass}
                    placeholder="80539"
                  />
                </label>
              </div>
              {formError ? (
                <Typography type="body-xs" className={cn(hx.caption, 'text-danger')}>
                  {formError}
                </Typography>
              ) : null}
              <Button
                variant="primary"
                isDisabled={saving || !street.trim()}
                onPress={() => void onSaveAddress()}
                className={cn(hx.btnPrimary, '!h-11')}
              >
                {t('settings.saveAddress')}
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-[18px] border border-dashed border-border px-4 py-3.5 text-[14px] font-semibold text-muted"
          >
            {t('settings.addAddress')}
          </button>
        )}
      </div>

      <Typography type="body-xs" className={cn(hx.caption, 'mt-4 mb-2')}>
        {t('settings.account')}
      </Typography>
      <Card className={cn(hx.card, 'mb-6 overflow-hidden !p-0')}>
        <Card.Content className="p-0">
          <LinkRow label={t('settings.help')} href="/help/" />
          <LinkRow label={t('settings.privacy')} />
          <LinkRow label={t('settings.terms')} last />
        </Card.Content>
      </Card>

      <Button
        variant="danger"
        onPress={() => {
          logout();
          router.replace('/login/');
        }}
        className={hx.btnDanger}
      >
        {t('common.logout')}
      </Button>

      <Typography type="body-xs" className={cn(hx.caption, 'mt-6 mb-8 text-center')}>
        {t('settings.version')}
      </Typography>
    </AppFrame>
  );
}
