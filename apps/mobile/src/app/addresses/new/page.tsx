"use client";
import { AppText } from "@/components/Text";

import { FormScope, Input, Form, RadioField } from "@repo/ui/forms";
import { Button as FormButton } from "@heroui/react";

import { Button } from "@heroui/react";
import { apiRequest, withAuth } from "@repo/api";
import { LocationMap } from "@repo/api/components/location-map";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  AccountField,
  AccountNotice,
  AccountScreen,
} from "@/components/AccountScreen";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

const LABELS = [
  { value: "Home", key: "address.homeLabel", icon: "🏠" },
  { value: "Work", key: "address.workLabel", icon: "🏢" },
  { value: "Other", key: "address.otherLabel", icon: "📍" },
] as const;

export default function AddAddressPage() {
  const router = useRouter();
  const { t, hydrated, authed, createAddress, accessToken } = useApp();
  const search = useSyncExternalStore(
    () => () => undefined,
    () => window.location.search,
    () => "",
  );
  const source = new URLSearchParams(search).get("from");
  const returnPath =
    source === "checkout"
      ? "/checkout/"
      : source === "addresses"
        ? "/addresses/"
        : "/settings/";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{
      label: string;
      street: string;
      city: string;
      zipcode: string;
      latitude: number;
      longitude: number;
    }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [label, setLabel] = useState("Home");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Munich");
  const [zipcode, setZipcode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!authed) {
      const next = `/addresses/new/?from=${source === "checkout" ? "checkout" : "settings"}`;
      router.replace(`/login/?next=${encodeURIComponent(next)}`);
    }
  }, [authed, hydrated, router, source]);

  const save = async () => {
    setError(null);
    setStatus(null);
    if (!street.trim() || !city.trim()) {
      setError(t("address.required"));
      return;
    }
    if (!authed) {
      router.push("/login/?next=/addresses/new/");
      return;
    }
    if (
      !latitude.trim() ||
      !longitude.trim() ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude)) ||
      Math.abs(Number(latitude)) > 90 ||
      Math.abs(Number(longitude)) > 180
    ) {
      setError("Choose your delivery location or enter valid coordinates.");
      return;
    }
    setSaving(true);
    try {
      await createAddress({
        label,
        latitude: Number(latitude),
        longitude: Number(longitude),
        street: street.trim(),
        city: city.trim(),
        zipcode: zipcode.trim() || undefined,
      });
      setStatus(t("address.success"));
      window.setTimeout(() => router.replace(returnPath), 650);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t("login.errorGeneric"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormScope>
      {
        <AccountScreen
          title={t("address.newTitle")}
          subtitle={t("address.subtitle")}
          backHref={returnPath}
        >
          <div className="mb-5 h-72 overflow-hidden rounded-2xl border">
            <LocationMap
              latitude={
                latitude
                  ? Number(latitude)
                  : Number(
                      process.env.NEXT_PUBLIC_SERVICE_AREA_LATITUDE || 48.1374,
                    )
              }
              longitude={
                longitude
                  ? Number(longitude)
                  : Number(
                      process.env.NEXT_PUBLIC_SERVICE_AREA_LONGITUDE || 11.5755,
                    )
              }
              onSelect={(coords) => {
                setLatitude(coords.latitude.toFixed(6));
                setLongitude(coords.longitude.toFixed(6));
              }}
            />
          </div>
          <AppText as="p" className="mb-3 text-sm">
            Tap the map to place your delivery pin, or search for an address.
          </AppText>
          <div className="mb-5 space-y-2">
            <Input
              label={<>Search address</>}
              className="block w-full rounded-xl border p-3"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              isDisabled={searching || query.trim().length < 3}
              onPress={() => {
                setSearching(true);
                setError(null);
                void apiRequest<typeof results>(
                  `/api/v1/delivery/search?q=${encodeURIComponent(query.trim())}`,
                  withAuth({ accessToken: accessToken ?? undefined }),
                )
                  .then(setResults)
                  .catch((err) =>
                    setError(
                      err instanceof Error ? err.message : "Search failed.",
                    ),
                  )
                  .finally(() => setSearching(false));
              }}
            >
              Search
            </Button>
            {results.map((result, i) => (
              <FormButton
                variant="ghost"
                type="button"
                key={i}
                className="block w-full rounded border p-2 text-left"
                onPress={() => {
                  setStreet(result.street);
                  setCity(result.city);
                  setZipcode(result.zipcode);
                  setLatitude(String(result.latitude));
                  setLongitude(String(result.longitude));
                  setResults([]);
                }}
              >
                {result.label}
              </FormButton>
            ))}
          </div>

          {error ? <AccountNotice tone="danger">{error}</AccountNotice> : null}
          {status ? (
            <AccountNotice tone="success">{status}</AccountNotice>
          ) : null}

          <Form
            className="mt-4 grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <AccountField
              label={t("address.street")}
              name="street"
              autoComplete="street-address"
              placeholder={t("address.street")}
              value={street}
              onChange={(event) => setStreet(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <AccountField
                label={t("address.city")}
                name="city"
                autoComplete="address-level2"
                placeholder={t("address.city")}
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="px-4"
              />
              <AccountField
                label={t("address.zip")}
                name="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder={t("address.zip")}
                value={zipcode}
                onChange={(event) => setZipcode(event.target.value)}
                className="px-4"
              />
            </div>

            <div className="rounded-[24px] bg-surface-secondary p-4">
              <AppText as="p" className="mb-3 text-sm text-muted">
                Set the delivery location so your courier can find the right
                door. Use your current location only when you are at this
                address.
              </AppText>
              <Button
                type="button"
                variant="secondary"
                isPending={locating}
                isDisabled={locating}
                onPress={() => {
                  if (!navigator.geolocation) {
                    setError(
                      "Location is unavailable. Enter coordinates below.",
                    );
                    return;
                  }
                  setLocating(true);
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setLatitude(String(position.coords.latitude));
                      setLongitude(String(position.coords.longitude));
                      setLocating(false);
                      setError(null);
                    },
                    () => {
                      setLocating(false);
                      setError(
                        "Location permission was denied or timed out. Enter coordinates below.",
                      );
                    },
                    { enableHighAccuracy: true, timeout: 15000 },
                  );
                }}
              >
                Use current location
              </Button>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <AccountField
                  label="Latitude"
                  name="latitude"
                  required
                  type="number"
                  min={-90}
                  max={90}
                  step="any"
                  placeholder="Latitude"
                  inputMode="decimal"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
                <AccountField
                  label="Longitude"
                  name="longitude"
                  required
                  type="number"
                  min={-180}
                  max={180}
                  step="any"
                  placeholder="Longitude"
                  inputMode="decimal"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
            <RadioField
              name="addressLabel"
              label={t("address.labelAs")}
              value={label}
              onChange={(v) => setLabel(v as typeof label)}
              required
              options={LABELS.map((o) => ({
                id: o.value,
                label: (
                  <>
                    <AppText as="span" aria-hidden="true">
                      {o.icon}
                    </AppText>{" "}
                    {t(o.key)}
                  </>
                ),
              }))}
            />

            <Button
              type="submit"
              variant="primary"
              isPending={saving}
              isDisabled={saving}

              className={cn(hx.btnPrimary, "mt-4")}
            >
              {t("address.action")}
            </Button>
          </Form>
        </AccountScreen>
      }
    </FormScope>
  );
}
