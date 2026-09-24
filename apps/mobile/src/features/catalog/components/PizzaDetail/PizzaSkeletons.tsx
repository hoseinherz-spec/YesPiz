"use client";
import { Card, Skeleton } from "@heroui/react";
import { AppFrame } from "@/components/AppFrame";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { ChevronLeft } from "@/components/animated-icon/icons";
import detail from "./PizzaDetail.module.css";
import reviews from "./PizzaReviews.module.css";

export function ReviewsSkeleton({ full = false }: { full?: boolean }) {
  return (
    <div
      className={full ? reviews.list : reviews.carousel}
      role="status"
      aria-label="Loading reviews"
      aria-busy="true"
    >
      {[0, 1].map((index) => (
        <Card key={index} className={reviews.card}>
          <Card.Header className={reviews.cardHeader}>
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-36 rounded-lg" />
          </Card.Header>
          <Card.Content className="space-y-2">
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-4/5 rounded-lg" />
          </Card.Content>
          <Card.Footer className={reviews.cardFooter}>
            <Skeleton className="h-7 w-24 rounded-full" />
          </Card.Footer>
        </Card>
      ))}
    </div>
  );
}
export function RatingSkeleton() {
  return (
    <div
      className={reviews.overview}
      role="status"
      aria-label="Loading rating"
      aria-busy="true"
    >
      <div className={reviews.score}>
        <Skeleton className="h-16 w-24 rounded-xl" />
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-4 w-28 rounded-lg" />
      </div>
      <div className={reviews.distribution}>
        <div className={reviews.bars}>
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className={reviews.barRow}>
              <Skeleton className="h-5 w-3 rounded" />
              <Skeleton className="h-[6px] flex-1 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export function PizzaDetailSkeleton({
  backHref = "/menu/",
}: {
  backHref?: string;
}) {
  return (
    <AppFrame padded={false} className={detail.page}>
      <div className={detail.hero}>
        <div className={detail.pizzaStage}>
          <Skeleton className="size-[68cqw] rounded-full" />
        </div>
        <div className={detail.header}>
          <IconBadgeButton
            href={backHref}
            aria-label="Back"
            className={detail.iconButton}
          >
            <ChevronLeft size={23} />
          </IconBadgeButton>
          <span>Details</span>
          <Skeleton className="size-12 rounded-full" />
        </div>
      </div>
      <section
        className={detail.sheet}
        role="status"
        aria-label="Loading pizza details"
        aria-busy="true"
      >
        <svg
          className={detail.sheetCurve}
          viewBox="0 0 558 144"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 144 V132 C0 89 22 72 72 72 H220 C272 72 273 0 342 0 H486 C537 0 558 16 558 72 V144 Z"
            fill="currentColor"
          />
        </svg>
        <div className={detail.delivery}>
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="mt-2 h-4 w-24 rounded" />
        </div>
        <Skeleton className="h-7 w-3/5 rounded-lg" />
        <Skeleton className="mt-2 h-8 w-24 rounded-lg" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
        <div className={detail.facts}>
          {[0, 1].map((index) => (
            <div key={index} className={detail.fact}>
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Skeleton className="mb-4 h-5 w-28 rounded" />
          <div className="flex gap-4">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-20 flex-1 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
      <div className={detail.actionBar} aria-hidden="true">
        <Skeleton className="h-12 w-28 rounded-full" />
        <Skeleton className="h-14 flex-1 rounded-[28px]" />
      </div>
    </AppFrame>
  );
}
