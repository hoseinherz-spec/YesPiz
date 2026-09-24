"use client";
import { Button, Card } from "@heroui/react";
import { paymentsClient, type SavedCard } from "@repo/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Trash1, Wallet } from "@/components/animated-icon/icons";
import { SavedPaymentCard } from "@/components/SavedPaymentCard";
import cardStyles from "@/components/SavedPaymentCard.module.css";
import { StripeSaveCard } from "@/components/StripeSaveCard";
import { useApp } from "@/context/AppContext";
import { PaymentCardsSkeleton } from "@/features/profile/components/ProfileSkeletons";
import styles from "@/features/profile/components/Profile.module.css";

export default function PaymentMethodsPage() {
  const { language, accessToken, hydrated } = useApp();
  const de = language === "de";
  const [result, setResult] = useState<{
    token: string;
    cards: SavedCard[];
  } | null>(null);
  const [setup, setSetup] = useState<{ token: string; secret: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!accessToken) return;
    const cards = await paymentsClient.savedCards({ accessToken });
    setResult({ token: accessToken, cards });
  }, [accessToken]);
  useEffect(() => {
    let live = true;
    if (accessToken)
      paymentsClient
        .savedCards({ accessToken })
        .then((cards) => {
          if (live) {
            setResult({ token: accessToken, cards });
            setError("");
          }
        })
        .catch(() => {
          if (live)
            setError(
              de
                ? "Karten konnten nicht geladen werden."
                : "Unable to load saved cards.",
            );
        });
    return () => {
      live = false;
    };
  }, [accessToken, de]);
  const cards = result?.token === accessToken ? result.cards : null;
  const secret = setup?.token === accessToken ? setup.secret : null;
  async function add() {
    if (!accessToken || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await paymentsClient.setupCard({ accessToken });
      setSetup({ token: accessToken, secret: response.clientSecret });
    } catch {
      setError(
        de
          ? "Karte kann derzeit nicht hinzugefügt werden."
          : "Unable to add a card right now. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppFrame padded={false} className={styles.subpage}>
      <ScreenHeader
        title={de ? "Zahlungsmethoden" : "Payment Methods"}
        backHref="/profile/"
      />
      <div className={styles.pageIntro}>
        <h1>{de ? "Deine Zahlungsmittel" : "Your wallet"}</h1>
        <p>
          {de
            ? "Gespeicherte Karten und Guthaben an einem Ort."
            : "Saved cards and pizza credit, all in one place."}
        </p>
      </div>
      {!hydrated ? (
        <PaymentCardsSkeleton />
      ) : !accessToken ? (
        <Link
          href="/auth/sign-in/?next=/profile/payment-methods/"
          className="text-accent underline"
        >
          {de
            ? "Anmelden, um Karten zu verwalten"
            : "Sign in to manage saved cards"}
        </Link>
      ) : (
        <>
          {error && (
            <div role="alert" className="mb-4 text-sm text-danger">
              {error}
              <Button
                variant="ghost"
                onPress={() => {
                  setError("");
                  void load().catch(() =>
                    setError(
                      de ? "Erneut versuchen." : "Unable to load saved cards.",
                    ),
                  );
                }}
              >
                {de ? "Erneut versuchen" : "Retry"}
              </Button>
            </div>
          )}
          {notice && (
            <p role="status" className="mb-4 text-sm text-success">
              {notice}
            </p>
          )}
          {secret ? (
            <StripeSaveCard
              key={secret}
              clientSecret={secret}
              onCancel={() => setSetup(null)}
              onSaved={async () => {
                setSetup(null);
                setNotice(de ? "Karte gespeichert." : "Card saved.");
                try {
                  await load();
                } catch {
                  setError(
                    de
                      ? "Karte gespeichert. Liste konnte nicht aktualisiert werden."
                      : "Card saved, but the list couldn’t refresh. Please retry.",
                  );
                }
              }}
            />
          ) : (
            <>
              {!cards && !error && <PaymentCardsSkeleton />}
              <div className={cardStyles.wallet}>
                {cards?.map((card) => (
                  <div key={card.id} className={cardStyles.item}>
                    <SavedPaymentCard card={card} language={language} />
                    <div className={cardStyles.actions}>
                      <Button
                        isIconOnly
                        variant="ghost"
                        isDisabled={busy}
                        aria-label={`${de ? "Karte entfernen" : "Remove card"} ${card.last4}`}
                        onPress={() => setRemoving(card.id)}
                      >
                        <Trash1 size={20} />
                      </Button>
                    </div>
                    {removing === card.id && (
                      <div className="flex flex-wrap gap-2">
                        <span className="w-full text-sm">
                          {de
                            ? "Diese Karte entfernen?"
                            : "Remove this saved card?"}
                        </span>
                        <Button
                          variant="secondary"
                          isDisabled={busy}
                          onPress={() => setRemoving(null)}
                        >
                          {de ? "Abbrechen" : "Cancel"}
                        </Button>
                        <Button
                          variant="danger"
                          isPending={busy}
                          onPress={async () => {
                            if (busy) return;
                            setBusy(true);
                            setError("");
                            try {
                              await paymentsClient.removeCard(card.id, {
                                accessToken,
                              });
                              setResult((old) =>
                                old
                                  ? {
                                      ...old,
                                      cards: old.cards.filter(
                                        (item) => item.id !== card.id,
                                      ),
                                    }
                                  : old,
                              );
                              setRemoving(null);
                            } catch {
                              setError(
                                de
                                  ? "Karte konnte nicht entfernt werden."
                                  : "Unable to remove card. Please retry.",
                              );
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          {de ? "Entfernen" : "Remove"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {cards?.length === 0 && (
                <p className={styles.note}>
                  {de
                    ? "Noch keine Karten gespeichert."
                    : "No saved cards yet."}
                </p>
              )}
              <Card className={`${styles.card} mt-3`}>
                <Card.Content className={styles.paymentRow}>
                  <Wallet size={28} />
                  <strong>{de ? "Yespiz Guthaben" : "Yespiz credit"}</strong>
                  <Link
                    href="/credit/"
                    className="text-sm text-accent underline"
                  >
                    {de ? "Ansehen" : "View"}
                  </Link>
                </Card.Content>
              </Card>
              <p className={styles.note}>
                {de
                  ? "Deine Karten werden sicher bei Stripe gespeichert."
                  : "Your cards are stored securely with Stripe."}
              </p>
              <Button
                className={styles.bottomAction}
                isPending={busy}
                isDisabled={
                  !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || busy
                }
                onPress={() => void add()}
              >
                {de ? "Neue Karte hinzufügen" : "Add New Card"}
              </Button>
              {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                <p className={styles.note}>
                  {de
                    ? "Kartenspeicherung ist derzeit nicht verfügbar."
                    : "Card saving is currently unavailable."}
                </p>
              )}
            </>
          )}
        </>
      )}
    </AppFrame>
  );
}
