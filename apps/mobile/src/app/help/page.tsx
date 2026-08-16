'use client';

import { Button, Card, Typography } from '@heroui/react';
import { ChevronDown, MessageCircle, Phone } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const FAQS = [1, 2, 3, 4, 5] as const;

export default function HelpPage() {
  const router = useRouter();
  const { t } = useApp();
  const [open, setOpen] = useState(0);

  return (
    <AppFrame>
      <ScreenHeader title={t('help.title')} subtitle={t('help.subtitle')} />

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onPress={() => router.push('/chat/')}
          className="h-auto min-h-36 flex-col items-start gap-2 rounded-[28px] border-0 bg-surface-secondary p-4 text-left shadow-none"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <MessageCircle size={19} />
          </span>
          <span className="mt-1 text-[16px] font-bold text-foreground">{t('help.liveChat')}</span>
          <span className="whitespace-normal text-[11px] leading-4 font-medium text-muted">{t('help.liveChatDetail')}</span>
        </Button>
        <a
          href="tel:+498912345678"
          className="flex min-h-36 flex-col items-start gap-2 rounded-[28px] bg-surface-secondary p-4 text-left"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Phone size={19} />
          </span>
          <span className="mt-1 text-[16px] font-bold text-foreground">{t('help.call')}</span>
          <span className="text-[11px] leading-4 font-medium text-muted">+49 89 1234 5678</span>
        </a>
      </div>

      <Typography type="h3" className={cn(hx.h3, 'mt-8 mb-3')}>
        {t('help.faqTitle')}
      </Typography>
      <div className="flex flex-col gap-2.5">
        {FAQS.map((n, i) => {
          const isOpen = open === i;
          return (
            <Card key={n} className="overflow-hidden rounded-[24px] border-0 bg-surface-secondary p-0 shadow-none">
              <Button
                variant="ghost"
                onPress={() => setOpen(isOpen ? -1 : i)}
                className="flex h-auto min-h-16 w-full items-center justify-between gap-3 rounded-none px-4 py-3.5"
              >
                <Typography type="h6" className={cn(hx.title, 'text-left')}>
                  {t(`faq.q${n}`)}
                </Typography>
                <ChevronDown
                  size={18}
                  color="var(--muted)"
                  className={cn('shrink-0 transition', isOpen && 'rotate-180')}
                />
              </Button>
              {isOpen ? (
                <div className="border-t border-border px-4 py-4">
                  <Typography type="body-sm" className={hx.bodySm}>
                    {t(`faq.a${n}`)}
                  </Typography>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <Button
        variant="primary"
        fullWidth
        onPress={() => router.push('/chat/')}
        className={cn(hx.btnPrimary, 'mt-7 mb-6 justify-start px-3')}
      >
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent-foreground)_9%,transparent)]">
          <MessageCircle size={20} />
        </span>
        <span className="flex-1 text-left">
          <span className="block text-[15px] font-bold">{t('help.startChat')}</span>
          <span className="block text-[10px] font-semibold opacity-60">{t('help.startChatDetail')}</span>
        </span>
      </Button>
    </AppFrame>
  );
}
