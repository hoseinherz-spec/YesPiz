"use client";
import { useState } from "react";
import { Button } from "@heroui/react";
type Contact = { name?: string[]; tel?: string[] };
export function InviteFriends({ code, de }: { code: string; de: boolean }) {
  const [contacts, setContacts] = useState<Contact[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const text = de
    ? `Komm zu Yespiz! Verwende meinen Einladungscode ${code} vor deiner ersten Zahlung.`
    : `Join me on Yespiz! Use my invite code ${code} before your first payment.`;
  async function share() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (navigator.share) await navigator.share({ title: "Yespiz", text });
      else {
        await navigator.clipboard.writeText(text);
        setNotice(
          de
            ? "Einladung kopiert. Wähle einen Kontakt in deiner Nachrichten-App."
            : "Invitation copied. Choose a friend in your messaging app.",
        );
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setError(
          de
            ? "Bitte kopiere den Code oben manuell."
            : "Please copy the code above manually.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function pick() {
    if (busy) return;
    const manager = (
      navigator as Navigator & {
        contacts?: {
          select: (
            fields: string[],
            options: { multiple: boolean },
          ) => Promise<Contact[]>;
        };
      }
    ).contacts;
    if (!manager) {
      setNotice(
        de
          ? "Nutze Teilen, um Freunde in deiner Nachrichten-App auszuwählen."
          : "Use Share to choose friends in your messaging app.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      setContacts(await manager.select(["name", "tel"], { multiple: true }));
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setError(
          de
            ? "Kontakte konnten nicht geöffnet werden. Nutze Teilen."
            : "Contacts could not be opened. Use Share instead.",
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-5 rounded-3xl bg-card p-5">
      <h2 className="font-semibold">
        {de ? "Freunde einladen" : "Invite friends"}
      </h2>
      <p className="my-3 text-sm text-muted">
        {de
          ? "Wähle Freunde aus und bestätige die Einladung in deiner Nachrichten-App."
          : "Choose friends and confirm the invitation in your messaging app."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button isDisabled={busy} onPress={() => void share()}>
          {de ? "Teilen" : "Share invitation"}
        </Button>
        <Button
          variant="secondary"
          isDisabled={busy}
          onPress={() => void pick()}
        >
          {de ? "Kontakte auswählen" : "Choose contacts"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm">
          {notice}
        </p>
      )}
      {contacts.map((c, i) => (
        <div
          key={i}
          className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"
        >
          <span className="break-all">
            {c.name?.[0] || c.tel?.[0] || (de ? "Kontakt" : "Contact")}
          </span>
          {c.tel
            ?.filter((n) => /^\+?[0-9 ()-]{5,25}$/.test(n))
            .map((n, j) => (
              <a
                key={j}
                className="rounded-full bg-accent px-4 py-2 text-accent-foreground"
                href={`sms:${n.replace(/[^+0-9]/g, "")}?body=${encodeURIComponent(text)}`}
              >
                {de ? "Nachricht öffnen" : "Open message"}
              </a>
            ))}
        </div>
      ))}
      {contacts.length > 0 && (
        <Button variant="ghost" onPress={() => setContacts([])}>
          {de ? "Auswahl löschen" : "Clear selection"}
        </Button>
      )}
    </section>
  );
}
