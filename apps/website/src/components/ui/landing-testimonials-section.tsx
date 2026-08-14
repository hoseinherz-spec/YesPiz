"use client";

import * as React from "react";
import { Avatar, Card, Typography } from "@heroui/react";
import { Quotes } from "@repo/icons";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/base-ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

const t = landingContent.reviews;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function LandingTestimonialsSection() {
  const plugin = React.useMemo(
    () =>
      Autoplay({
        delay: 500,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        playOnInit: true,
      }),
    [],
  );

  return (
    <section
      id="reviews"
      className={cn(
        "relative z-20 w-full rounded-b-[2.5rem] bg-surface px-6 py-16 text-foreground",
        "md:rounded-b-[3.5rem] md:px-10 md:py-20",
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
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
              <span className="text-brand-lime">{t.titleAccent}</span>
            </Typography>
            <Typography
              type="body-xs"
              className="max-w-sm text-[10px] font-bold text-muted md:text-xs"
            >
              {t.subtitle}
            </Typography>
          </div>

          <div className="relative h-[400px] w-full rounded-lg lg:h-[500px]">
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-20 bg-gradient-to-b from-surface to-transparent" />

            <Carousel
              orientation="vertical"
              opts={{
                loop: true,
                align: "start",
              }}
              plugins={[plugin]}
              onMouseEnter={plugin.stop}
              onMouseLeave={() => plugin.reset()}
              className="h-full w-full [&_[data-slot=carousel-content]]:h-[400px] lg:[&_[data-slot=carousel-content]]:h-[500px]"
            >
              <CarouselContent className="-mt-4">
                {t.items.map((testimonial) => (
                  <CarouselItem
                    key={testimonial.handle}
                    className="basis-auto pt-4"
                  >
                    <Card
                      className={cn(
                        "rounded-[2rem] border border-border bg-surface-secondary ring-0",
                        "transition-all duration-200",
                      )}
                    >
                      <Card.Content className="flex flex-col gap-4 p-5 md:p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar size="md" className="rounded-lg">
                              <Avatar.Fallback className="rounded-lg bg-brand-purple text-xs font-black text-accent-foreground">
                                {getInitials(testimonial.author)}
                              </Avatar.Fallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <Typography
                                type="body-sm"
                                className="font-black text-foreground uppercase"
                              >
                                {testimonial.author}
                              </Typography>
                              <Typography type="body-xs" className="text-muted">
                                {testimonial.district}
                              </Typography>
                            </div>
                          </div>
                          <Quotes className="h-5 w-5 text-brand-lime" size={20} />
                        </div>
                        <Typography
                          type="body-sm"
                          className="leading-relaxed text-foreground"
                        >
                          &ldquo;{testimonial.content}&rdquo;
                        </Typography>
                        <Typography type="body-xs" className="text-muted/70">
                          {testimonial.date}
                        </Typography>
                      </Card.Content>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-20 bg-gradient-to-t from-surface to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
