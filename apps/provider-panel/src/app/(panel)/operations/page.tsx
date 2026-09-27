"use client";
import { FormAction, FormScope, Input } from "@repo/ui/forms";

import { OpeningHours } from "@/components/OpeningHours";

import {
  ApiError,
  catalogClient,
  providersClient,
  type Provider,
  type PublishedMenuItem,
} from "@repo/api";
import { Button, Card, Typography } from "@heroui/react";
import { useCallback, useState } from "react";
import { requireProviderToken } from "@/lib/auth";
import { useLoadOnMount } from "@/lib/load-on-mount";

export default function OperationsPage() {
  const [menuSearch, setMenuSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState<Provider | null>(null);
  const [menuItems, setMenuItems] = useState<PublishedMenuItem[]>([]);
  const [acceptCap, setAcceptCap] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  const [pauseUntil, setPauseUntil] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = requireProviderToken();
      const [me, menu] = await Promise.all([
        providersClient.getMeProfile({ accessToken: token }),
        catalogClient.getPublishedMenu(),
      ]);
      setProfile(me);
      setAcceptCap(me.acceptCap != null ? String(me.acceptCap) : "");
      setMenuItems(menu.items ?? []);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load operations",
      );
    }
  }, []);

  useLoadOnMount(() => {
    void load();
  });

  async function saveAcceptCap() {
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      const trimmed = acceptCap.trim();
      const body: { acceptCap: number | null } = { acceptCap: null };
      if (trimmed !== "") {
        const parsed = Number(trimmed);
        if (!Number.isSafeInteger(parsed) || parsed < 1) {
          setError(
            "Accept cap must be a whole number of at least 1, or blank for no limit",
          );
          return;
        }
        body.acceptCap = parsed;
      }
      const updated = await providersClient.updateMeProfile(body, {
        accessToken: token,
      });
      setProfile(updated);
      setNotice("Changes saved. Your kitchen availability is up to date.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function pauseOrders() {
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      if (
        pauseUntil &&
        (!Number.isFinite(new Date(pauseUntil).getTime()) ||
          new Date(pauseUntil).getTime() <= Date.now())
      ) {
        setError("Choose a resume time in the future, or leave it blank.");
        return;
      }
      const updated = await providersClient.pause(
        {
          reason: pauseReason.trim() || undefined,
          until: pauseUntil ? new Date(pauseUntil).toISOString() : undefined,
        },
        { accessToken: token },
      );
      setProfile(updated);
      setNotice("Changes saved. Your kitchen availability is up to date.");
      setPauseReason("");
      setPauseUntil("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Pause failed");
    } finally {
      setBusy(false);
    }
  }

  async function resumeOrders() {
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      const updated = await providersClient.resume({ accessToken: token });
      setProfile(updated);
      setNotice("Changes saved. Your kitchen availability is up to date.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Resume failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleItem(itemId: string, unavailable: boolean) {
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      const updated = unavailable
        ? await providersClient.eightySix(
            { menuItemIds: [itemId] },
            { accessToken: token },
          )
        : await providersClient.clearEightySix(
            { menuItemIds: [itemId] },
            { accessToken: token },
          );
      setProfile(updated);
      setNotice("Changes saved. Your kitchen availability is up to date.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Inventory update failed",
      );
    } finally {
      setBusy(false);
    }
  }

  const unavailable = new Set(profile?.eightySixedItemIds ?? []);
  const paused = profile?.acceptingOrders === false;
  const visibleMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(menuSearch.trim().toLowerCase()) &&
      (stockFilter === "all" ||
        unavailable.has(item.id) === (stockFilter === "unavailable")),
  );

  return (
    <FormScope>
      {
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Typography type="h1" className="text-2xl font-semibold">
                Operations
              </Typography>
              <p className="text-muted text-sm">
                Capacity, pause, and menu availability
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onPress={load}
              isDisabled={busy}
            >
              Refresh
            </Button>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          {notice && (
            <p
              role="status"
              className="rounded-2xl border border-border bg-card p-4 text-sm"
            >
              {notice}
            </p>
          )}

          {profile ? (
            <Card className="p-4">
              <FormScope>
                <Card.Content className="flex flex-col gap-3 p-0">
                  <Typography type="h3" className="font-medium">
                    Live capacity
                  </Typography>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-muted">Open orders</dt>
                      <dd className="font-medium">{profile.openOrders}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Accept cap</dt>
                      <dd className="font-medium">
                        {profile.acceptCap ?? "No limit"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Accepting orders</dt>
                      <dd className="font-medium">
                        {profile.acceptingOrders ? "Yes" : "No"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Status</dt>
                      <dd className="font-medium">
                        {paused ? "Paused" : "Active"}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-sm" role="status">
                    {paused
                      ? "New offers are paused. Continue preparing existing orders."
                      : profile.acceptCap == null
                        ? "No capacity limit. Set a cap to protect preparation times during a rush."
                        : `${Math.max(0, profile.acceptCap - profile.openOrders)} spaces remaining before new offers stop.`}
                  </p>
                  {profile.pauseReason ? (
                    <p className="text-muted text-sm">
                      Pause reason: {profile.pauseReason}
                    </p>
                  ) : null}
                  {profile.pausedUntil ? (
                    <p className="text-muted text-sm">
                      Paused until{" "}
                      {new Date(profile.pausedUntil).toLocaleString()}
                    </p>
                  ) : null}

                  <Input
                    label={
                      <>
                        <span className="text-muted">
                          Accept cap (blank = no limit)
                        </span>
                      </>
                    }
                    wrapperClassName="flex flex-col gap-1 text-sm"
                    type="number"
                    min={1}
                    step={1}
                    value={acceptCap}
                    onChange={(e) => setAcceptCap(e.target.value)}
                    className="border-border bg-background max-w-[10rem] rounded-md border px-3 py-2"
                  />
                  <FormAction
                    size="sm"
                    variant="secondary"
                    isDisabled={busy}
                    onPress={saveAcceptCap}
                  >
                    Save accept cap
                  </FormAction>
                </Card.Content>
              </FormScope>
            </Card>
          ) : null}

          <Card className="p-4">
            <FormScope>
              <Card.Content className="flex flex-col gap-3 p-0">
                <Typography type="h3" className="font-medium">
                  Pause / resume
                </Typography>
                <Input
                  label={
                    <>
                      <span className="text-muted">Reason (optional)</span>
                    </>
                  }
                  wrapperClassName="flex flex-col gap-1 text-sm"
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="Equipment issue, rush, etc."
                  className="border-border bg-background rounded-md border px-3 py-2"
                />
                <Input
                  label={
                    <>
                      <span className="text-muted">Resume at (optional)</span>
                    </>
                  }
                  wrapperClassName="flex flex-col gap-1 text-sm"
                  type="datetime-local"
                  value={pauseUntil}
                  onChange={(e) => setPauseUntil(e.target.value)}
                  className="border-border bg-background max-w-[16rem] rounded-md border px-3 py-2"
                />
                <div className="flex flex-wrap gap-2">
                  <FormAction
                    size="sm"
                    variant="primary"
                    isDisabled={busy || !profile || paused}
                    onPress={pauseOrders}
                  >
                    Pause new offers
                  </FormAction>
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={busy || !profile || !paused}
                    onPress={resumeOrders}
                  >
                    Resume
                  </Button>
                </div>
              </Card.Content>
            </FormScope>
          </Card>

          <Card className="p-4">
            <Card.Content className="flex flex-col gap-3 p-0">
              <Typography type="h3" className="font-medium">
                Menu availability
              </Typography>
              <p className="text-muted text-sm">
                Unavailable items cannot be assigned to your kitchen.
              </p>
              <div className="panel-filter-bar">
                <input
                  type="search"
                  aria-label="Search menu availability"
                  placeholder="Find a menu item…"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
                {["all", "available", "unavailable"].map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={stockFilter === value}
                    onClick={() => setStockFilter(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {!menuItems.length ? (
                <p className="text-muted text-sm">No published menu items</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {visibleMenuItems.map((item) => {
                    const out = unavailable.has(item.id);
                    return (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className={out ? "text-muted line-through" : ""}>
                          {item.name}
                        </span>
                        <Button
                          size="sm"
                          variant={out ? "primary" : "secondary"}
                          isDisabled={busy}
                          onPress={() => toggleItem(item.id, !out)}
                        >
                          {out ? "Restore availability" : "Mark unavailable"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {menuItems.length > 0 && !visibleMenuItems.length && (
                <p role="status" className="text-muted text-sm">
                  No menu items match. Clear your search or choose another
                  availability filter.
                </p>
              )}
            </Card.Content>
          </Card>
          <OpeningHours />
        </div>
      }
    </FormScope>
  );
}
