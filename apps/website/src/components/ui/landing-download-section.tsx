"use client";

import { buttonVariants, Typography } from "@heroui/react";
import { Apple, GooglePlay } from "@repo/icons";
import {
  APP_STORE_URL,
  APP_WEB_URL,
  PLAY_STORE_URL,
} from "@/content/app-links";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

const t = landingContent.download;

export function LandingDownloadSection() {
  return (
    <section
      id="download"
      className={cn(
        "relative z-20 w-full rounded-t-[2.5rem] px-6 py-12 text-foreground",
        "shadow_-[0_-20px_50px_rgba(0,0,0,0.2)] md:rounded-t-[3.5rem] md:px-10 md:py-16",
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div
          className={cn(
            "relative isolate flex flex-col items-center justify-between gap-8 overflow-hidden",
            "rounded-[2rem] border border-border bg-surface-secondary p-8 md:flex-row md:gap-12 md:px-10 md:py-16",
          )}
        >
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-[max(-7rem,calc(50%-52rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
              }}
              className="aspect-[577/310] w-[36rem] bg-gradient-to-r from-brand-lime to-brand-lime/60 opacity-30"
            />
          </div>

          <div
            aria-hidden="true"
            className="absolute top-1/2 left-[max(45rem,calc(50%+8rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
              }}
              className="aspect-[577/310] w-[36rem] bg-gradient-to-r from-brand-lime to-brand-olive opacity-30"
            />
          </div>

          <div className="flex max-w-xl flex-col items-center gap-4 text-center md:items-start md:text-left">
            <Typography
              type="body-xs"
              className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase md:text-xs"
            >
              {t.eyebrow}
            </Typography>
            <div className="flex flex-col gap-2">
              <Typography
                type="h2"
                className="text-2xl leading-[0.95] font-black tracking-tight uppercase md:text-4xl"
              >
                {t.title}
                <br />
                <span className="text-brand-lime">{t.titleAccent}</span>
              </Typography>
              <Typography
                type="body-xs"
                className="max-w-[600px] text-[10px] font-bold text-muted md:text-xs"
              >
                {t.subtitle}
              </Typography>
            </div>
          </div>

          <div className="mt-2 flex w-full max-w-xs shrink-0 flex-col justify-center gap-3 sm:flex-row md:mt-0 md:w-auto md:flex-col">
            <a
              href={APP_WEB_URL}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 w-full gap-2 rounded-2xl bg-brand-lime px-8 text-base font-black text-brand-olive uppercase shadow-sm md:w-auto",
              )}
            >
              Order online
            </a>
            <a
              href={APP_STORE_URL}
              aria-label={t.iosStore}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 w-full gap-2 rounded-2xl bg-brand-purple px-8 text-base font-black text-accent-foreground uppercase shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-2px_5px_rgba(0,0,0,0.1),0_8px_20px_rgba(0,0,0,0.1)] md:w-auto",
              )}
            >
              <Apple className="h-4 w-4" size={16} />
              {t.iosStore}
            </a>
            <a
              href={PLAY_STORE_URL}
              aria-label={t.androidStore}
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-12 w-full gap-2 rounded-2xl border-border bg-surface px-8 text-base font-black text-foreground uppercase shadow-sm md:w-auto",
              )}
            >
              <GooglePlay className="h-4 w-4" size={16} />
              {t.androidStore}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
