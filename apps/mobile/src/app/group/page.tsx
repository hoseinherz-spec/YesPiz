"use client";
import { PageIntro } from "@/components/PageIntro";
import { Suspense, useCallback, useEffect, useState } from "react";
import { openHostedCheckout } from "@/lib/hosted-checkout";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import {
  Check,
  Clock,
  Gift,
  ArrowRight,
} from "@/components/animated-icon/icons";
import { groupsClient, type GroupCartView } from "@repo/api";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { EmptyState } from "@/components/EmptyState";
import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { useMenuCatalog } from "@/lib/catalog";
import { formatPrice } from "@/constants/pizzas";
import { pizzaCraftAsset } from "@/constants/media";
function GroupPageInner() {
  const params = useSearchParams(),
    router = useRouter(),
    token = params.get("id");
  const { accessToken, language, selectedAddressId } = useApp();
  const de = language === "de";
  const cart = useCart();
  const catalog = useMenuCatalog();
  const [group, setGroup] = useState<GroupCartView | null>(null),
    [groups, setGroups] = useState<GroupCartView[]>([]);
  const [title, setTitle] = useState("Pizza night"),
    [minutes, setMinutes] = useState(30),
    [split, setSplit] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      if (token) setGroup(await groupsClient.read(token, { accessToken }));
      else setGroups(await groupsClient.list({ accessToken }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load group.");
    }
  }, [accessToken, token]);
  useEffect(() => {
    void Promise.resolve().then(load);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => clearInterval(timer);
  }, [load]);
  async function action(
    kind: "create" | "add" | "lock" | "pay" | "submit" | "cancel" | "reopen",
  ) {
    if (!accessToken || busy) return;
    setBusy(true);
    setError("");
    try {
      const options = { accessToken };
      let next: GroupCartView;
      if (kind === "create") {
        next = await groupsClient.create(
          {
            title,
            split,
            menuVersion: catalog.menuVersion,
            deadline: new Date(Date.now() + minutes * 60000).toISOString(),
          },
          options,
        );
        router.push(`/group/?id=${next.token}`);
      } else {
        if (!group) return;
        if (kind === "add")
          next = await groupsClient.contribute(
            group.token,
            {
              revision: group.revision,
              lines: cart.items.map(
                ({
                  menuItemId,
                  quantity,
                  size,
                  extras,
                  variantId,
                  selections,
                  ingredientChanges,
                  secondHalfItemId,
                }) => ({
                  menuItemId,
                  quantity,
                  size,
                  extras,
                  variantId,
                  selections,
                  ingredientChanges,
                  secondHalfItemId,
                }),
              ),
            },
            options,
          );
        else if (kind === "lock")
          next = await groupsClient.lock(
            group.token,
            { revision: group.revision, addressId: selectedAddressId },
            options,
          );
        else if (kind === "pay")
          next = await groupsClient.payShare(group.token, options);
        else if (kind === "reopen")
          next = await groupsClient.reopen(
            group.token,
            group.revision,
            options,
          );
        else if (kind === "cancel")
          next = await groupsClient.cancel(
            group.token,
            group.revision,
            options,
          );
        else
          next = await groupsClient.submit(
            group.token,
            {
              revision: group.revision,
              expectedTotalCents: group.quote!.totalCents,
            },
            options,
          );
      }
      setGroup(next);
      if (next.checkoutUrl) await openHostedCheckout(next.checkoutUrl, load);
      else if (kind === "submit" && next.orderId && !next.mock && !next.split)
        router.push(`/payment/?orderId=${next.orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${location.origin}/group/?id=${group!.token}`,
      );
      setCopied(true);
    } catch {
      setError(
        de ? "Kopiere den Link unten." : "Copy the invitation link below.",
      );
    }
  }
  const me = group?.members.find((m) => m.mine);
  const stateLabel = (state: GroupCartView["state"]) =>
    ({
      open: de ? "Auswahl offen" : "Choosing pizzas",
      locked: de ? "Bereit zur Bestätigung" : "Ready for confirmation",
      ordered: de ? "Bestellung aufgegeben" : "Order placed",
      cancelling: de ? "Rückerstattung läuft" : "Refund in progress",
      cancelled: de ? "Abgebrochen" : "Cancelled",
    })[state];
  return (
    <AppFrame withTabs className="reference-screen">
      <ScreenHeader title={de ? "Gruppenbestellung" : "Group order"} />
      <PageIntro
        icon={<Gift />}
        title={
          group?.title ||
          (de ? "Zusammen schmeckt’s besser" : "Better together")
        }
        description={
          de
            ? "Eine Lieferung. Jeder wählt seine Pizza."
            : "One delivery. Everyone gets their favourite."
        }
      />
      {!accessToken ? (
        <EmptyState
          icon={<Gift size={28} />}
          image={pizzaCraftAsset("Pizza Cutting")}
          title={de ? "Gemeinsam bestellen" : "Bring everyone to the table"}
          body={
            de
              ? "Melde dich an, um eine Gruppe zu starten oder beizutreten."
              : "Sign in to start or join a pizza night."
          }
          actionHref={`/auth/sign-in/?next=${encodeURIComponent(token ? `/group/?id=${token}` : "/group/")}`}
          actionLabel={de ? "Anmelden" : "Sign in"}
        />
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="my-4 rounded-2xl border border-danger p-4"
            >
              <p>{error}</p>
              <Button variant="ghost" onPress={() => void load()}>
                {de ? "Aktualisieren" : "Refresh group"}
              </Button>
            </div>
          )}
          {!token ? (
            <>
              <form
                className="data-surface mt-6 space-y-5 rounded-[28px] p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  void action("create");
                }}
              >
                <label className="block text-sm font-semibold">
                  {de ? "Name der Gruppe" : "Name your pizza night"}
                  <input
                    required
                    maxLength={60}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-surface-secondary px-4"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  {de ? "Zeit zum Auswählen" : "Time to choose"}
                  <select
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-surface-secondary px-4"
                  >
                    {[15, 30, 60, 120].map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-5 shrink-0"
                    checked={split}
                    onChange={(e) => setSplit(e.target.checked)}
                  />
                  <span>
                    {de
                      ? "Kosten anteilig teilen (Mock)"
                      : "Split proportionally"}
                    <small className="mt-1 block leading-5 text-muted">
                      {de
                        ? "Anteil nach Warenwert, inklusive Lieferkosten. Keine echte Abbuchung."
                        : "Shares follow item value, including delivery fees. No real charge."}
                    </small>
                  </span>
                </label>
                <Button
                  type="submit"
                  className="min-h-12 w-full"
                  isDisabled={busy || !catalog.menuVersion}
                >
                  {de ? "Gruppe erstellen" : "Start a group order"}
                </Button>
              </form>
              {groups.length > 0 && (
                <section className="mt-7">
                  <h2 className="text-lg font-bold">
                    {de ? "Deine Gruppen" : "Your pizza nights"}
                  </h2>
                  {groups.map((g) => (
                    <Link
                      key={g.token}
                      href={`/group/?id=${g.token}`}
                      className="data-surface mt-3 flex items-center justify-between rounded-2xl p-4"
                    >
                      <span>
                        <strong>{g.title}</strong>
                        <small className="mt-1 block text-muted">
                          {g.members.length} · {stateLabel(g.state)}
                        </small>
                      </span>
                      <ArrowRight size={18} />
                    </Link>
                  ))}
                </section>
              )}
            </>
          ) : !group ? (
            <p role="status" className="py-8">
              {de ? "Gruppe wird geladen…" : "Loading your group…"}
            </p>
          ) : (
            <>
              <section className="data-surface mt-6 rounded-[28px] p-5">
                <div className="flex items-center gap-3">
                  <Clock size={20} />
                  <div>
                    <strong className="text-sm">
                      {de ? "Auswahl bis " : "Choose by "}
                      {new Date(group.deadline).toLocaleTimeString(
                        de ? "de-DE" : "en-GB",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </strong>
                    <p className="text-xs text-muted">
                      {group.state === "open"
                        ? de
                          ? "Gemeinsam auswählen"
                          : "Everyone can add their picks"
                        : stateLabel(group.state)}
                    </p>
                  </div>
                </div>
                {group.state === "open" && (
                  <>
                    <Button
                      className="mt-5 min-h-12 w-full"
                      variant="secondary"
                      onPress={() => void copy()}
                    >
                      {copied
                        ? de
                          ? "Link kopiert"
                          : "Invitation copied"
                        : de
                          ? "Einladungslink kopieren"
                          : "Copy invite link"}
                    </Button>
                    <input
                      readOnly
                      aria-label="Invitation link"
                      value={
                        typeof location !== "undefined"
                          ? `${location.origin}/group/?id=${group.token}`
                          : ""
                      }
                      className="mt-3 w-full truncate bg-transparent text-xs text-muted"
                    />
                    <p className="mt-2 text-xs text-muted">
                      {de
                        ? "Mitglieder sehen deinen Vornamen und deine Auswahl."
                        : "People with the link can see first names and contributions."}
                    </p>
                  </>
                )}
              </section>
              <section className="mt-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    {de ? "Am Tisch" : "Around the table"}
                  </h2>
                  <Button variant="ghost" onPress={() => void load()}>
                    {de ? "Aktualisieren" : "Refresh"}
                  </Button>
                </div>
                {!group.members.length && (
                  <p className="py-5 text-sm text-muted">
                    {de
                      ? "Die erste Pizza wartet auf dich."
                      : "Be the first to bring a pizza."}
                  </p>
                )}
                {group.members.map((m, i) => (
                  <article
                    key={i}
                    className="mt-3 flex items-center gap-3 border-b border-border py-4"
                  >
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-secondary font-bold">
                      {m.name.slice(0, 1)}
                    </span>
                    <div className="flex-1">
                      <strong className="text-sm">
                        {m.name}
                        {m.mine ? (de ? " (Du)" : " (You)") : ""}
                      </strong>
                      <p className="text-xs text-muted">
                        {m.quantity} {de ? "Pizzen" : "pizzas"}
                      </p>
                      {m.picks?.map((p, j) => (
                        <p key={j} className="mt-1 text-xs text-muted">
                          {p.quantity} ×{" "}
                          {catalog.items.find(
                            (item) => item.id === p.menuItemId,
                          )?.name ?? (de ? "Pizza" : "Pizza")}
                          {p.secondHalfItemId
                            ? ` / ${catalog.items.find((item) => item.id === p.secondHalfItemId)?.name ?? "Pizza"}`
                            : ""}{" "}
                          · {p.size}
                        </p>
                      ))}
                    </div>
                    {group.quote && (
                      <strong className="text-sm">
                        {formatPrice(m.shareCents / 100)}
                      </strong>
                    )}
                    {m.paid && <Check aria-label="Share confirmed" size={18} />}
                  </article>
                ))}
              </section>
              {group.state === "open" && !group.expired && (
                <div className="mt-5 space-y-3">
                  <Link
                    className="flex min-h-12 items-center justify-center rounded-full border border-border text-sm font-semibold"
                    href="/menu/"
                  >
                    {de ? "Pizzen auswählen" : "Choose pizzas"}
                  </Link>
                  {cart.items.length > 0 && (
                    <>
                      <Button
                        className="min-h-12 w-full"
                        isDisabled={
                          busy ||
                          !cart.items.length ||
                          cart.menuVersion !== group.menuVersion
                        }
                        onPress={() => void action("add")}
                      >
                        {de ? "Meinen Warenkorb übernehmen" : "Use my cart"} ·{" "}
                        {cart.count}
                      </Button>
                      <p className="text-xs leading-5 text-muted">
                        {de
                          ? "Ersetzt deine bisherige Auswahl in dieser Gruppe. Dein persönlicher Warenkorb bleibt erhalten."
                          : "Replaces your previous picks in this group. Your personal cart is kept."}
                      </p>
                    </>
                  )}
                </div>
              )}
              {group.owner &&
                group.state === "open" &&
                group.members.length > 0 && (
                  <div className="mt-5">
                    {!selectedAddressId ? (
                      <Link href="/addresses/new/" className="underline">
                        {de
                          ? "Lieferadresse hinzufügen"
                          : "Add delivery address"}
                      </Link>
                    ) : (
                      <Button
                        className="min-h-12 w-full"
                        isDisabled={busy || !group.members.length}
                        onPress={() => void action("lock")}
                      >
                        {de
                          ? "Auswahl schließen & Gesamtpreis prüfen"
                          : "Close picks & review total"}
                      </Button>
                    )}
                  </div>
                )}
              {group.quote && (
                <section className="data-surface mt-6 rounded-3xl p-5">
                  <p className="text-sm text-muted">
                    {de ? "Gesamtbetrag für alle" : "Everyone’s total"}
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    {formatPrice(group.quote.totalCents / 100)}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {de
                      ? "Inklusive Lieferung. Nicht abgeschlossene Gruppen werden nach Ablauf erstattet."
                      : "Includes delivery. Payments for unfinished groups are refunded after the deadline."}
                  </p>
                </section>
              )}
              {group.refundPending && (
                <p role="status" className="mt-4">
                  {de
                    ? "Rückerstattung läuft. Bitte später erneut prüfen."
                    : "Refunds are being processed. Check back shortly."}
                </p>
              )}
              {group.state === "locked" && (
                <div className="mt-5 space-y-3">
                  {group.split && me && !me.paid && (
                    <Button
                      className="min-h-12 w-full"
                      isDisabled={busy}
                      onPress={() => void action("pay")}
                    >
                      {de ? "Meinen Anteil bestätigen" : "Pay my share"} ·{" "}
                      {formatPrice(me.shareCents / 100)}
                    </Button>
                  )}
                  {group.owner && (
                    <Button
                      className="min-h-12 w-full"
                      isDisabled={
                        busy ||
                        (group.split && group.members.some((m) => !m.paid))
                      }
                      onPress={() => void action("submit")}
                    >
                      {de ? "Gruppenbestellung aufgeben" : "Place group order"}
                    </Button>
                  )}
                </div>
              )}
              {group.state === "ordered" && (
                <Link
                  href={
                    !group.split && !group.mock && group.orderId
                      ? `/payment/?orderId=${group.orderId}`
                      : "/orders/"
                  }
                  className="mt-5 flex min-h-12 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground"
                >
                  {!group.split && !group.mock
                    ? de
                      ? "Zur Zahlung"
                      : "Continue to payment"
                    : de
                      ? "Bestellung aufgegeben"
                      : "Order placed"}{" "}
                  · {de ? "Bestellungen" : "View orders"}
                </Link>
              )}
              {group.owner && group.state === "locked" && !group.orderId && (
                <Button
                  variant="secondary"
                  className="mt-4 w-full"
                  isDisabled={busy}
                  onPress={() => void action("reopen")}
                >
                  {de
                    ? "Auswahl erneut öffnen · 30 min"
                    : "Reopen picks · 30 min"}
                </Button>
              )}
              {group.owner && group.state === "locked" && !group.orderId && (
                <p className="mt-2 text-xs leading-5 text-muted">
                  {de
                    ? "Beim erneuten Öffnen werden Bestätigungen zurückgesetzt. Bei einem neuen Menü wählen alle ihre Pizzen erneut."
                    : "Reopening resets share confirmations. If the menu has changed, everyone chooses their pizzas again."}
                </p>
              )}
              {group.owner && ["open", "locked"].includes(group.state) && (
                <Button
                  variant="ghost"
                  className="mt-5 min-h-12 w-full"
                  isDisabled={busy}
                  onPress={() => void action("cancel")}
                >
                  {de ? "Gruppe abbrechen" : "Cancel group"}
                </Button>
              )}
            </>
          )}
        </>
      )}
    </AppFrame>
  );
}
export default function GroupPage() {
  return (
    <Suspense
      fallback={
        <AppFrame>
          <p role="status">Loading…</p>
        </AppFrame>
      }
    >
      <GroupPageInner />
    </Suspense>
  );
}
