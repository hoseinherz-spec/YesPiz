"use client";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import { MapPin, Check, ChevronRight } from "@repo/icons";
import Link from "next/link";
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
    <AppFrame className="reference-screen">
      <ScreenHeader
        title={de ? "Adressen" : "Addresses"}
        backHref="/profile/"
      />
      <p className="mb-5 text-sm text-muted">
        {de
          ? "Wähle deine Lieferadresse."
          : "Choose where your next pizza arrives."}
      </p>
      <div className="space-y-3">
        {addresses.map((address) => (
          <button
            key={address.id}
            type="button"
            className="reference-address"
            aria-pressed={selectedAddressId === address.id}
            onClick={() => setSelectedAddressId(address.id)}
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
          </button>
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
              : "/login/?next=/addresses/"
          }
          className="flex min-h-14 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground"
        >
          {de ? "Neue Adresse hinzufügen" : "Add new address"}
        </Link>
      </div>
    </AppFrame>
  );
}
