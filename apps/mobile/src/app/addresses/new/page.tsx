"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { apiRequest, withAuth } from "@repo/api";
import { LocationMap } from "@repo/api/components/location-map";
import {
  AccountField,
  AccountNotice,
  AccountScreen,
} from "@/components/AccountScreen";
import { AppText } from "@/components/Text";
import { Home, MapPin, Search } from "@/components/animated-icon/icons";
import { useApp } from "@/context/AppContext";
import { safeAuthDestination } from "@/lib/auth-destination";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";
import styles from "./address-form.module.css";

type SearchResult = {
  label: string;
  street: string;
  houseNumber: string;
  city: string;
  zipcode: string;
  latitude: number;
  longitude: number;
};

const COUNTRY = (process.env.NEXT_PUBLIC_PAYMENT_COUNTRY || "DE").toUpperCase();
const POSTCODE_LENGTH = COUNTRY === "AT" ? 4 : COUNTRY === "DE" ? 5 : 10;
const DEFAULT_LOCATION =
  COUNTRY === "AT"
    ? { latitude: 48.2082, longitude: 16.3738, city: "Vienna" }
    : { latitude: 48.1374, longitude: 11.5755, city: "Munich" };
const POSTCODE_PATTERN =
  COUNTRY === "AT"
    ? /^\d{4}$/
    : COUNTRY === "DE"
      ? /^\d{5}$/
      : /^[A-Z0-9][A-Z0-9 -]{1,8}[A-Z0-9]$/i;

export default function AddAddressPage() {
  const router = useRouter();
  const { language, hydrated, authed, createAddress, accessToken } = useApp();
  const de = language === "de";
  const search = useSyncExternalStore(
    () => () => undefined,
    () => window.location.search,
    () => "",
  );
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const source = params.get("from");
  const onboarding = source === "onboarding";
  const returnPath = onboarding
    ? safeAuthDestination(search)
    : source === "checkout"
      ? "/checkout/"
      : "/addresses/";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [label, setLabel] = useState(de ? "Zuhause" : "Home");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [city, setCity] = useState(
    COUNTRY === "AT" && de ? "Wien" : DEFAULT_LOCATION.city,
  );
  const [zipcode, setZipcode] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [unit, setUnit] = useState("");
  const [doorCode, setDoorCode] = useState("");
  const [instructions, setInstructions] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPin = Boolean(latitude && longitude);
  const mapLatitude = latitude ? Number(latitude) : DEFAULT_LOCATION.latitude;
  const mapLongitude = longitude
    ? Number(longitude)
    : DEFAULT_LOCATION.longitude;

  useEffect(() => {
    if (!hydrated || authed) return;
    const nextParams = new URLSearchParams({
      from: onboarding
        ? "onboarding"
        : source === "checkout"
          ? "checkout"
          : "addresses",
    });
    if (onboarding) nextParams.set("next", returnPath);
    router.replace(
      `/auth/sign-in/?next=${encodeURIComponent(`/addresses/new/?${nextParams}`)}`,
    );
  }, [authed, hydrated, onboarding, returnPath, router, source]);

  const chooseResult = (result: SearchResult) => {
    setStreet(result.street);
    setHouseNumber(result.houseNumber);
    setCity(
      result.city || (COUNTRY === "AT" && de ? "Wien" : DEFAULT_LOCATION.city),
    );
    setZipcode(result.zipcode);
    setLatitude(String(result.latitude));
    setLongitude(String(result.longitude));
    setQuery(result.label);
    setResults([]);
    setError(null);
  };

  const searchAddress = async () => {
    if (searching || query.trim().length < 3) return;
    setSearching(true);
    setError(null);
    try {
      const found = await apiRequest<SearchResult[]>(
        `/api/v1/delivery/search?q=${encodeURIComponent(query.trim())}`,
        withAuth({ accessToken: accessToken ?? undefined }),
      );
      setResults(found);
      if (!found.length) {
        setError(
          de
            ? "Keine Adresse gefunden. Prüfe die Eingabe oder setze den Pin auf der Karte."
            : "No address found. Check the spelling or place the pin on the map.",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : de
            ? "Die Adresssuche ist gerade nicht verfügbar."
            : "Address search is unavailable right now.",
      );
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(
        de
          ? "Der Standort ist auf diesem Gerät nicht verfügbar."
          : "Location is unavailable on this device.",
      );
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError(
          de
            ? "Standortzugriff fehlgeschlagen. Setze den Pin manuell auf der Karte."
            : "We could not access your location. Place the pin manually on the map.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const save = async () => {
    setError(null);
    if (!hasPin) {
      setError(
        de
          ? "Setze den Pin genau am Hauseingang."
          : "Place the pin precisely at your building entrance.",
      );
      return;
    }
    if (!street.trim() || !houseNumber.trim() || !city.trim()) {
      setError(
        de
          ? "Straße, Hausnummer und Ort sind erforderlich."
          : "Street, house number, and city are required.",
      );
      return;
    }
    if (!POSTCODE_PATTERN.test(zipcode.trim())) {
      setError(
        COUNTRY === "AT"
          ? de
            ? "Eine österreichische Postleitzahl hat vier Ziffern."
            : "An Austrian postcode must contain four digits."
          : COUNTRY === "DE"
            ? de
              ? "Eine deutsche Postleitzahl hat fünf Ziffern."
              : "A German postcode must contain five digits."
            : de
              ? "Gib eine gültige Postleitzahl ein."
              : "Enter a valid postcode.",
      );
      return;
    }
    if (!label.trim()) {
      setError(de ? "Gib diesem Ort einen Namen." : "Give this place a name.");
      return;
    }
    if (!authed) {
      router.push("/auth/sign-in/?next=/addresses/new/");
      return;
    }
    setSaving(true);
    try {
      await createAddress({
        label: label.trim(),
        street: `${street.trim()} ${houseNumber.trim()}`,
        city: city.trim(),
        zipcode: zipcode.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        entrance: entrance.trim() || undefined,
        floor: floor.trim() || undefined,
        unit: unit.trim() || undefined,
        doorCode: doorCode.trim() || undefined,
        instructions: instructions.trim() || undefined,
      });
      router.replace(returnPath);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : de
            ? "Die Adresse konnte nicht gespeichert werden."
            : "We could not save this address.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountScreen
      title={de ? "Lieferadresse" : "Delivery address"}
      subtitle={
        onboarding
          ? de
            ? "Letzter Schritt · Wohin dürfen wir liefern?"
            : "Final step · Where should we deliver?"
          : de
            ? "Neuen Ort hinzufügen"
            : "Add a new place"
      }
      backHref={onboarding ? undefined : returnPath}
      className={styles.screen}
    >
      <section
        className={styles.mapSection}
        aria-label={de ? "Standort wählen" : "Choose location"}
      >
        <div className={styles.map}>
          <LocationMap
            latitude={mapLatitude}
            longitude={mapLongitude}
            label={de ? "Lieferort auf der Karte" : "Delivery location on map"}
            onSelect={(coords) => {
              setLatitude(coords.latitude.toFixed(6));
              setLongitude(coords.longitude.toFixed(6));
              setError(null);
            }}
          />
          <div className={cn(styles.pinStatus, hasPin && styles.pinReady)}>
            <MapPin size={17} />
            {hasPin
              ? de
                ? "Pin gesetzt"
                : "Pin placed"
              : de
                ? "Tippe auf die Karte"
                : "Tap the map"}
          </div>
          <Button
            type="button"
            variant="secondary"
            className={styles.locateButton}
            isPending={locating}
            isDisabled={locating}
            onPress={useCurrentLocation}
          >
            <MapPin size={18} />
            {de ? "Mein Standort" : "Use my location"}
          </Button>
        </div>
        <form
          className={styles.searchBox}
          onSubmit={(event) => {
            event.preventDefault();
            void searchAddress();
          }}
        >
          <Search size={20} />
          <label className="sr-only" htmlFor="address-search">
            {de ? "Adresse suchen" : "Search address"}
          </label>
          <input
            id="address-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              de ? "Straße, Hausnummer, PLZ" : "Street, number, postcode"
            }
            autoComplete="street-address"
          />
          <Button
            type="submit"
            variant="primary"
            isIconOnly
            aria-label={de ? "Adresse suchen" : "Search address"}
            isPending={searching}
            isDisabled={searching || query.trim().length < 3}
            className={styles.searchButton}
          >
            <Search size={18} />
          </Button>
        </form>
        {results.length > 0 && (
          <div
            className={styles.results}
            role="list"
            aria-label={de ? "Suchergebnisse" : "Search results"}
          >
            {results.map((result) => (
              <button
                type="button"
                key={`${result.latitude}-${result.longitude}`}
                onClick={() => chooseResult(result)}
              >
                <MapPin size={19} />
                <span>{result.label}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {error ? <AccountNotice tone="danger">{error}</AccountNotice> : null}

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <SectionHeading
          title={de ? "Adressdetails" : "Address details"}
          description={
            COUNTRY === "AT"
              ? de
                ? "Die österreichische Zustelladresse, wie sie am Gebäude steht."
                : "Enter the Austrian delivery address as shown on the building."
              : COUNTRY === "DE"
                ? de
                  ? "Die deutsche Zustelladresse, wie sie am Gebäude steht."
                  : "Enter the German delivery address as shown on the building."
                : de
                  ? "Gib die Zustelladresse so ein, wie sie am Gebäude steht."
                  : "Enter the delivery address as shown on the building."
          }
        />
        <div className={styles.streetGrid}>
          <AccountField
            required
            label={de ? "Straße" : "Street"}
            name="street"
            autoComplete="address-line1"
            placeholder={de ? "Straße" : "Street"}
            value={street}
            onChange={(event) => setStreet(event.target.value)}
          />
          <AccountField
            required
            label={de ? "Hausnummer" : "House no."}
            name="houseNumber"
            autoComplete="address-line2"
            placeholder={de ? "Nr." : "No."}
            value={houseNumber}
            onChange={(event) => setHouseNumber(event.target.value)}
          />
        </div>
        <div className={styles.postcodeGrid}>
          <AccountField
            required
            label={de ? "PLZ" : "Postcode"}
            name="postalCode"
            inputMode={
              COUNTRY === "AT" || COUNTRY === "DE" ? "numeric" : "text"
            }
            autoComplete="postal-code"
            maxLength={POSTCODE_LENGTH}
            pattern={
              COUNTRY === "AT"
                ? "[0-9]{4}"
                : COUNTRY === "DE"
                  ? "[0-9]{5}"
                  : undefined
            }
            placeholder={
              COUNTRY === "AT"
                ? "1010"
                : COUNTRY === "DE"
                  ? "80331"
                  : "Postcode"
            }
            value={zipcode}
            onChange={(event) =>
              setZipcode(
                (COUNTRY === "AT" || COUNTRY === "DE"
                  ? event.target.value.replace(/\D/g, "")
                  : event.target.value
                ).slice(0, POSTCODE_LENGTH),
              )
            }
          />
          <AccountField
            required
            label={de ? "Ort" : "City"}
            name="city"
            autoComplete="address-level2"
            placeholder={
              COUNTRY === "AT"
                ? de
                  ? "Wien"
                  : "Vienna"
                : DEFAULT_LOCATION.city
            }
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>

        <SectionHeading
          title={de ? "Gebäudedetails" : "Building details"}
          description={
            de
              ? "Optional, aber hilfreich für eine schnelle Zustellung."
              : "Optional, but useful for a faster handoff."
          }
        />
        <div className={styles.accessGrid}>
          <AccountField
            label="Stiege"
            name="entrance"
            placeholder="A"
            value={entrance}
            onChange={(event) => setEntrance(event.target.value)}
          />
          <AccountField
            label={de ? "Stock" : "Floor"}
            name="floor"
            placeholder="2"
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
          />
          <AccountField
            label={de ? "Tür" : "Door"}
            name="unit"
            placeholder="12"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          />
        </div>
        <AccountField
          label={de ? "Türcode (optional)" : "Entry code (optional)"}
          name="doorCode"
          autoComplete="off"
          placeholder={de ? "Türcode" : "Entry code"}
          value={doorCode}
          onChange={(event) => setDoorCode(event.target.value)}
        />
        <label className={styles.textareaLabel}>
          <span>
            {de ? "Hinweise für die Zustellung" : "Delivery instructions"}
          </span>
          <textarea
            value={instructions}
            maxLength={250}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder={
              de
                ? "Zum Beispiel: Eingang im Innenhof"
                : "For example: entrance inside the courtyard"
            }
          />
        </label>

        <SectionHeading
          title={de ? "Ort benennen" : "Name this place"}
          description={
            de
              ? "So findest du ihn beim nächsten Mal schneller."
              : "This makes it easy to choose next time."
          }
        />
        <div className={styles.labelSuggestions}>
          {[de ? "Zuhause" : "Home", de ? "Arbeit" : "Work"].map(
            (suggestion, index) => (
              <button
                type="button"
                key={suggestion}
                aria-pressed={label === suggestion}
                onClick={() => setLabel(suggestion)}
              >
                {index === 0 ? <Home size={18} /> : <MapPin size={18} />}
                {suggestion}
              </button>
            ),
          )}
        </div>
        <AccountField
          required
          label={de ? "Eigener Name" : "Custom name"}
          name="addressLabel"
          placeholder={de ? "z. B. Mama, Studio" : "e.g. Mum’s, Studio"}
          value={label}
          maxLength={40}
          onChange={(event) => setLabel(event.target.value)}
        />

        <Button
          type="submit"
          variant="primary"
          isPending={saving}
          isDisabled={saving}
          className={cn(hx.btnPrimary, styles.submit)}
        >
          {saving
            ? de
              ? "Wird gespeichert…"
              : "Saving…"
            : onboarding
              ? de
                ? "Adresse speichern und starten"
                : "Save address and continue"
              : de
                ? "Adresse speichern"
                : "Save address"}
        </Button>
      </form>
    </AccountScreen>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={styles.sectionHeading}>
      <AppText as="h2">{title}</AppText>
      <AppText as="p">{description}</AppText>
    </div>
  );
}
