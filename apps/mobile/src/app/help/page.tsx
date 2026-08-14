'use client';

import { Button, Card, Typography } from '@heroui/react';
import { ChevronDown, MessageCircle, Phone } from '@repo/icons';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { ContactTile } from '@/features/help/components/ContactTile';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const FAQS = [1, 2, 3, 4, 5] as const;

export default function HelpPage() {
  const { t } = useApp();
  const [open, setOpen] = useState(0);

  return (
    <AppFrame>
      <ScreenHeader title={t('help.title')} subtitle={t('help.subtitle')} />

      <div className="grid grid-cols-2 gap-2">
        <ContactTile
          icon={<MessageCircle size={18} />}
          title={t('help.liveChat')}
          detail={t('help.liveChatDetail')}
        />
        <ContactTile
          icon={<Phone size={18} />}
          title={t('help.call')}
          detail="+49 89 1234 5678"
        />
      </div>

      <Typography type="h6" className={cn(hx.title, 'mt-6 mb-2')}>
        {t('help.faqTitle')}
      </Typography>
      <div className="flex flex-col gap-2">
        {FAQS.map((n, i) => {
          const isOpen = open === i;
          return (
            <Card key={n} className={cn(hx.card, 'overflow-hidden !p-0')}>
              <Button
                variant="ghost"
                onPress={() => setOpen(isOpen ? -1 : i)}
                className="flex h-auto w-full items-center justify-between gap-3 rounded-none px-4 py-3.5"
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
                <div className="border-t border-border px-4 py-3">
                  <Typography type="body-sm" className={hx.bodySm}>
                    {t(`faq.a${n}`)}
                  </Typography>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <Card
        className={cn(
          hx.cardElevated,
          'mt-6 mb-6 border-accent bg-accent',
        )}
      >
        <Card.Content className="flex items-center gap-3 p-0">
          <MessageCircle size={20} className="text-accent-foreground" />
          <div>
            <Typography type="h6" className={cn(hx.title, 'text-accent-foreground')}>
              {t('help.startChat')}
            </Typography>
            <Typography
              type="body-xs"
              className="text-[rgba(8,17,31,0.7)]"
            >
              {t('help.startChatDetail')}
            </Typography>
          </div>
        </Card.Content>
      </Card>
    </AppFrame>
  );
}
