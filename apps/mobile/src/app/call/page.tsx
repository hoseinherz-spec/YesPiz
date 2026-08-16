'use client';

import { Button, Typography } from '@heroui/react';
import { Microphone, MicrophoneSlash, Phone, Truck } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export default function CallPage() {
  const router = useRouter();
  const { t } = useApp();
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (ended) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [ended]);

  return (
    <AppFrame padded={false}>
      <div className="flex min-h-dvh flex-col bg-black px-[clamp(20px,8vw,38px)] pt-[max(32px,env(safe-area-inset-top))] pb-[max(28px,env(safe-area-inset-bottom))] text-white">
        <div className="text-center">
          <Typography type="body-xs" className="text-[12px] font-semibold text-white/55">
            {t('call.demo')}
          </Typography>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative flex size-32 items-center justify-center rounded-full bg-[#1b1b22]">
            <Truck size={42} className="text-white" />
            <span className="absolute right-1 bottom-2 size-5 rounded-full border-4 border-black bg-success" />
          </div>
          <Typography type="h1" className="mt-7 text-[34px] font-extrabold text-white">
            {t('tracking.courierName')}
          </Typography>
          <Typography type="body" aria-live="polite" className="mt-2 text-[21px] font-semibold tracking-[0.08em] text-white/60">
            {ended ? t('call.ended') : formatDuration(seconds)}
          </Typography>
          <Typography type="body-sm" className="mt-4 max-w-[310px] text-[12px] leading-5 text-white/45">
            {t('call.limitation')}
          </Typography>
        </div>

        {ended ? (
          <Button
            variant="primary"
            fullWidth
            onPress={() => router.replace('/tracking/')}
            className={cn(hx.btnPrimary, 'bg-white text-black')}
          >
            {t('call.return')}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <Button
                isIconOnly
                variant="secondary"
                aria-label={muted ? t('call.unmute') : t('call.mute')}
                onPress={() => setMuted((value) => !value)}
                className="size-18 min-w-18 rounded-full border-0 bg-[#1b1b22] text-white shadow-none"
              >
                {muted ? <MicrophoneSlash size={27} /> : <Microphone size={27} />}
              </Button>
              <span className="text-[11px] font-semibold text-white/55">{muted ? t('call.unmute') : t('call.mute')}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button
                isIconOnly
                variant="danger"
                aria-label={t('call.end')}
                onPress={() => setEnded(true)}
                className="size-18 min-w-18 rounded-full bg-danger text-danger-foreground shadow-none"
              >
                <Phone size={28} />
              </Button>
              <span className="text-[11px] font-semibold text-white/55">{t('call.end')}</span>
            </div>
          </div>
        )}
      </div>
    </AppFrame>
  );
}
