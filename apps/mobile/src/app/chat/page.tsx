'use client';

import { Button, Input, Label, TextField, Typography } from '@heroui/react';
import { ArrowLeft, ArrowUp, MessageCircle, Truck } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';

type Message = { id: number; body: string; sender: 'courier' | 'you' };

export default function ChatPage() {
  const router = useRouter();
  const { t } = useApp();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'courier', body: t('chat.welcome') },
  ]);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    setMessages((current) => [...current, { id: Date.now(), body, sender: 'you' }]);
    setDraft('');
  };

  return (
    <AppFrame padded={false}>
      <div className="flex min-h-dvh flex-col bg-black text-white">
        <header className="flex items-center gap-3 px-[clamp(20px,8vw,38px)] pt-[max(24px,env(safe-area-inset-top))] pb-4">
          <Button
            isIconOnly
            variant="secondary"
            aria-label={t('chat.back')}
            onPress={() => router.back()}
            className="size-14 min-w-14 rounded-full border-0 bg-[#1b1b22] text-white shadow-none"
          >
            <ArrowLeft size={21} />
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <Typography type="body-xs" className="text-[11px] font-medium text-white/50">{t('chat.courierLabel')}</Typography>
            <Typography type="h6" className="truncate text-[17px] font-bold text-white">{t('tracking.courierName')}</Typography>
          </div>
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Truck size={21} />
          </span>
        </header>

        <div className="mx-[clamp(20px,8vw,38px)] rounded-[18px] bg-[#1b1b22] px-4 py-3 text-center">
          <p className="text-[11px] leading-4 text-white/55">{t('chat.limitation')}</p>
        </div>

        <main
          aria-live="polite"
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-[clamp(20px,8vw,38px)] py-6"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex max-w-[86%] items-end gap-2',
                message.sender === 'you' ? 'ml-auto flex-row-reverse' : 'mr-auto',
              )}
            >
              <span className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full',
                message.sender === 'you' ? 'bg-accent text-accent-foreground' : 'bg-[#1b1b22] text-white',
              )}>
                {message.sender === 'you' ? <MessageCircle size={14} /> : <Truck size={14} />}
              </span>
              <div>
                <p className={cn('mb-1 text-[10px] text-white/55', message.sender === 'you' && 'text-right')}>
                  {message.sender === 'you' ? t('chat.you') : t('tracking.courierName')}
                </p>
                <p className={cn(
                  'rounded-[24px] px-4 py-3 text-[14px] leading-5',
                  message.sender === 'you'
                    ? 'rounded-br-md bg-accent text-accent-foreground'
                    : 'rounded-bl-md bg-[#1b1b22] text-white',
                )}>
                  {message.body}
                </p>
              </div>
            </div>
          ))}
        </main>

        <div className="bg-black px-[clamp(20px,8vw,38px)] pt-3 pb-[max(18px,env(safe-area-inset-bottom))]">
          <TextField className="w-full" name="message">
            <Label className="sr-only">{t('chat.inputLabel')}</Label>
            <div className="flex items-center gap-2 rounded-full bg-[#1b1b22] p-2 pl-5">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                placeholder={t('chat.placeholder')}
                className="h-12 min-w-0 flex-1 border-0 bg-transparent px-0 text-[15px] text-white outline-none placeholder:text-white/45"
              />
              <Button
                isIconOnly
                variant="primary"
                aria-label={t('chat.send')}
                onPress={send}
                isDisabled={!draft.trim()}
                className="size-12 min-w-12 rounded-full bg-white text-black shadow-none"
              >
                <ArrowUp size={20} />
              </Button>
            </div>
          </TextField>
        </div>
      </div>
    </AppFrame>
  );
}
