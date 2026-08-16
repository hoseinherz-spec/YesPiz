'use client';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';

const SECTIONS = [
  ['privacy.introTitle', 'privacy.introBody'],
  ['privacy.dataTitle', 'privacy.dataBody'],
  ['privacy.controlTitle', 'privacy.controlBody'],
  ['privacy.childrenTitle', 'privacy.childrenBody'],
] as const;

export default function PrivacyPage() {
  const { t } = useApp();

  return (
    <AppFrame>
      <ScreenHeader title={t('privacy.title')} backHref="/settings/" />
      <article className="pb-[max(40px,env(safe-area-inset-bottom))]">
        {SECTIONS.map(([title, body]) => (
          <section key={title} className="mb-9">
            <h1 className="text-[26px] font-bold tracking-[-0.02em] text-foreground">
              {t(title)}
            </h1>
            <p className="mt-3 text-[15px] leading-[1.65] text-text-secondary">
              {t(body)}
            </p>
          </section>
        ))}
        <p className="border-t border-border pt-6 text-sm text-muted">
          {t('privacy.updated')}
        </p>
      </article>
    </AppFrame>
  );
}
