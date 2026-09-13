"use client";

import * as React from "react";
import { Link, Typography } from "@heroui/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/base-ui/accordion";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

const t = landingContent.faq;

export function LandingFaqSection() {
  return (
    <section
      id="faq"
      className={cn(
        "relative z-20 w-full bg-surface-hover px-6 py-16 text-foreground",
        "md:px-10 md:py-20",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-16 md:gap-24">
        <div className="flex flex-col items-start space-y-4 text-left">
          <Typography
            type="body-xs"
            className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase md:text-xs"
          >
            {t.eyebrow}
          </Typography>
          <Typography
            type="h2"
            className="text-3xl leading-[0.95] font-black tracking-tight text-foreground uppercase md:text-5xl"
          >
            {t.title}
            <br />
            <span className="landing-accent-copy">{t.titleAccent}</span>
          </Typography>
        </div>

        {t.categories.map((category, idx) => (
          <div
            key={category.title}
            className="grid grid-cols-1 items-start gap-8 md:gap-12 lg:grid-cols-12 lg:gap-16"
          >
            <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:col-span-4">
              <Typography
                type="h3"
                className="text-xl leading-tight font-black tracking-tight text-foreground uppercase md:text-2xl"
              >
                {category.title}
              </Typography>
              <Typography
                type="body-xs"
                className="text-[10px] leading-relaxed font-bold text-muted md:text-xs"
              >
                {category.description}{" "}
                <Link
                  href={category.contactHref}
                  className="text-foreground underline transition-colors hover:text-brand-lime"
                >
                  {category.contactLabel}
                </Link>
                .
              </Typography>
            </div>

            <div className="lg:col-span-8">
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, itemIdx) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${idx}-${itemIdx}`}
                    className="border-border/80 border-b"
                  >
                    <AccordionTrigger
                      className={cn(
                        "py-5 text-left text-base font-black text-foreground uppercase transition-colors",
                        "hover:text-accent hover:no-underline md:text-lg",
                      )}
                    >
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent
                      className={cn(
                        "pb-6 text-[10px] leading-relaxed font-bold text-muted md:text-xs lg:pr-12",
                      )}
                    >
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
