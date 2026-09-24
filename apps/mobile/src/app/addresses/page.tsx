"use client";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { MapPin, Check, ChevronRight } from "@/components/animated-icon/icons";
import Link from "next/link";
import { Button, buttonVariants } from "@heroui/react";
import { AddressesSkeleton } from "@/features/profile/components/ProfileSkeletons";
import styles from "@/features/profile/components/Profile.module.css";
export default function AddressesPage() {
  const {
    addresses,
    selectedAddressId,
    setSelectedAddressId,
    language,
    authed,
    hydrated,
  } = useApp();
  const de = language === "de";
  return (
    <AppFrame padded={false} className={styles.subpage}>
      <ScreenHeader title={de ? "Adressen" : "Address"} backHref="/profile/" />
      {!hydrated && <AddressesSkeleton />}
      <div className="space-y-3">
        {addresses.map((address) => (
          <Button
            variant="ghost"
            key={address.id}
            type="button"
            className={`reference-address ${styles.card}`}
            aria-pressed={selectedAddressId === address.id}
            onPress={() => setSelectedAddressId(address.id)}
          >
            <span className="reference-address-icon">
              <MapPin size={24} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-base">{address.label}</strong>
              <span className="mt-1 block break-words text-sm text-muted">
                {address.detail}
              </span>
            </span>
            {selectedAddressId === address.id ? (
              <Check size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </Button>
        ))}
      </div>
      {hydrated && !addresses.length && (
        <p className="my-8 text-sm text-muted">
          {de ? "Noch keine Adresse gespeichert." : "No saved addresses yet."}
        </p>
      )}
      <div className="mt-auto pt-8 pb-5">
        <Link
          href={
            authed
              ? "/addresses/new/?from=addresses"
              : "/auth/sign-in/?next=/addresses/"
          }
          className={`${buttonVariants({ variant: "primary" })} ${styles.bottomAction}`}
        >
          {de ? "Neue Adresse hinzufügen" : "Add new address"}
        </Link>
      </div>
    </AppFrame>
  );
}
