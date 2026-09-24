"use client";
import { Skeleton } from "@heroui/react";
import styles from "./Profile.module.css";
import cardStyles from "@/components/SavedPaymentCard.module.css";

export function IdentitySkeleton() {
  return (
    <div
      className={styles.identity}
      role="status"
      aria-label="Loading profile"
      aria-busy="true"
    >
      <Skeleton className="size-[86px] shrink-0 rounded-full" />
      <div className="grid gap-3">
        <Skeleton className="h-5 w-36 rounded-lg" />
        <Skeleton className="h-4 w-48 max-w-full rounded-lg" />
      </div>
    </div>
  );
}
export function ProfileFormSkeleton() {
  return (
    <div
      className={styles.form}
      role="status"
      aria-label="Loading profile"
      aria-busy="true"
    >
      <div className={styles.editAvatar}>
        <Skeleton className="size-28 rounded-full" />
      </div>
      {[0, 1, 2, 3].map((index) => (
        <div key={index}>
          <Skeleton className="mb-2 ms-3 h-4 w-24 rounded-lg" />
          <Skeleton className="h-[50px] w-full rounded-[20px]" />
        </div>
      ))}
      <Skeleton className="mt-auto h-[55px] w-full rounded-full" />
    </div>
  );
}
export function PaymentCardsSkeleton() {
  return (
    <div
      className={styles.cards}
      role="status"
      aria-label="Loading saved cards"
      aria-busy="true"
    >
      {[0, 1].map((index) => (
        <div key={index} className={cardStyles.card}>
          <Skeleton className="h-10 w-24 rounded-lg" />
          <div className={cardStyles.details}>
            <Skeleton className="h-5 w-40 max-w-full rounded-lg" />
            <Skeleton className="h-7 w-full rounded-lg" />
            <Skeleton className="h-12 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
export function FavoritesSkeleton() {
  return (
    <div
      className={styles.cards}
      role="status"
      aria-label="Loading favorites"
      aria-busy="true"
    >
      {[0, 1, 2].map((index) => (
        <div key={index} className={styles.card}>
          <div className="flex gap-4">
            <Skeleton className="size-[120px] max-[360px]:size-[96px] shrink-0 rounded-[20px]" />
            <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
              <Skeleton className="h-5 w-4/5 rounded-lg" />
              <Skeleton className="h-4 w-3/5 rounded-lg" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-14 rounded-lg" />
                <Skeleton className="h-4 w-10 rounded-lg" />
                <Skeleton className="ms-auto size-10 shrink-0 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
export function AddressesSkeleton() {
  return (
    <div
      className={styles.cards}
      role="status"
      aria-label="Loading addresses"
      aria-busy="true"
    >
      {[0, 1, 2].map((index) => (
        <div key={index} className={`reference-address ${styles.card}`}>
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-4 w-4/5 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-2 rounded" />
        </div>
      ))}
    </div>
  );
}
