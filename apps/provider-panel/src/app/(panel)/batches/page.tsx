"use client";
import { FormAction, FormScope, Input, RadioField } from "@repo/ui/forms";

import {
  ApiError,
  batchesClient,
  couriersClient,
  providersClient,
  type Batch,
  type SuggestBatchResponse,
} from "@repo/api";
import { Button, Card, Typography } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { getProviderToken, requireProviderToken } from "@/lib/auth";
import { useLiveRefresh } from "@/lib/use-live-refresh";
import Link from "next/link";
import { entityId } from "@/lib/ids";
import { useLoadOnMount } from "@/lib/load-on-mount";

export default function BatchesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [loaded, setLoaded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [notice, setNotice] = useState("");
  const [couriers, setCouriers] = useState<
    Array<{ userId: string; name: string; vehicleType?: string }>
  >([]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestBatchResponse | null>(
    null,
  );
  const [batches, setBatches] = useState<Batch[]>([]);
  const [keepByBatch, setKeepByBatch] = useState<Record<string, string[]>>({});
  const [courierByBatch, setCourierByBatch] = useState<Record<string, string>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = requireProviderToken();
      const [profile, list, available] = await Promise.all([
        providersClient.getMeProfile({ accessToken: token }),
        batchesClient.listForProvider({ accessToken: token }),
        couriersClient.available({ accessToken: token }),
      ]);
      setProviderId(entityId(profile));
      setBatches(list);
      setCouriers((previous) => JSON.stringify(previous) === JSON.stringify(available) ? previous : available);
      setKeepByBatch((previous) =>
        Object.fromEntries(
          list.map((batch) => {
            const id = entityId(batch);
            const ids = (batch.orderIds ?? []).map(String);
            return [
              id,
              previous[id]
                ? previous[id].filter((orderId) => ids.includes(orderId))
                : ids,
            ];
          }),
        ),
      );
      setLoaded(true);
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load batches",
      );
    }
  }, []);

  useLiveRefresh(
    getProviderToken(),
    providerId ? `provider:${providerId}` : undefined,
    load,
  );

  useLoadOnMount(() => {
    void load();
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function suggest() {
    if (!providerId) return;
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      const res = await batchesClient.suggest(
        { providerId },
        { accessToken: token },
      );
      setSuggestion(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suggest failed");
    } finally {
      setBusy(false);
    }
  }

  async function createFromSuggestion() {
    if (!providerId || !suggestion?.suggestedOrderIds.length) return;
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      await batchesClient.create(
        {
          providerId,
          orderIds: suggestion.suggestedOrderIds,
        },
        { accessToken: token },
      );
      setSuggestion(null);
      setNotice("Pickup group created. Choose an on-duty courier to continue.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function reduceBatch(batchId: string) {
    const keepOrderIds = keepByBatch[batchId] ?? [];
    if (!keepOrderIds.length) return;
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      await batchesClient.reduce(
        batchId,
        { keepOrderIds },
        { accessToken: token },
      );
      setNotice(
        "Pickup group updated. Removed orders are available for another group.",
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reduce failed");
    } finally {
      setBusy(false);
    }
  }

  function toggleKeep(batchId: string, orderId: string) {
    setKeepByBatch((prev) => {
      const current = prev[batchId] ?? [];
      const next = current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId];
      return { ...prev, [batchId]: next };
    });
  }

  async function assignCourier(batchId: string) {
    const courierId = (courierByBatch[batchId] ?? "").trim();
    if (!courierId) {
      setError("Choose a courier who is on duty");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = requireProviderToken();
      await batchesClient.assignCourier(
        batchId,
        { courierId },
        { accessToken: token },
      );
      setCourierByBatch((prev) => ({ ...prev, [batchId]: "" }));
      setNotice(
        "Courier assigned. Return to the kitchen board to coordinate pickup and verify the seal.",
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Assign courier failed");
    } finally {
      setBusy(false);
    }
  }

  const visibleBatches = batches.filter(
    (batch) =>
      (filter === "all" ||
        (filter === "active"
          ? !["completed", "cancelled"].includes(batch.status)
          : batch.status === filter)) &&
      [entityId(batch), ...batch.orderIds].some((id) =>
        id.toLowerCase().includes(search.trim().toLowerCase()),
      ),
  );

  return (
    <FormScope>
      {
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div>
            <Typography type="h1" className="text-2xl font-semibold">
              Courier handoff
            </Typography>
            <p className="text-muted text-sm">
              Group ready orders, assign the right vehicle, and verify pickup.
              {updatedAt ? ` Updated ${updatedAt}.` : ""}
            </p>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          {notice && (
            <p role="status" className="panel-notice">
              {notice}
            </p>
          )}
          <div className="panel-stat-grid">
            <div className="panel-stat">
              <strong>
                {batches.filter((b) => b.status === "open").length}
              </strong>
              <span>Awaiting courier</span>
            </div>
            <div className="panel-stat">
              <strong>
                {batches.filter((b) => b.status === "assigned").length}
              </strong>
              <span>Assigned for pickup</span>
            </div>
            <div className="panel-stat">
              <strong>
                {batches.filter((b) => b.status === "in_progress").length}
              </strong>
              <span>On the way</span>
            </div>
            <div className="panel-stat">
              <strong>{couriers.length}</strong>
              <span>Couriers on duty</span>
            </div>
          </div>
          <div className="panel-process-strip">
            <span>01 · Quality & seal</span>
            <span>02 · Group ready orders</span>
            <span>03 · Assign courier</span>
            <Link href="/kitchen/">04 · Verify pickup →</Link>
          </div>

          <Card className="p-4">
            <Card.Content className="flex flex-col gap-3 p-0">
              <Typography type="h3" className="font-medium">
                Prepare a pickup group
              </Typography>
              <p className="text-muted text-sm">
                Find ready orders that can travel together. Car, motorcycle and
                scooter couriers are shown with their vehicle when available.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  isDisabled={busy || !providerId}
                  onPress={suggest}
                >
                  Find ready orders
                </Button>
                <Button
                  variant="primary"
                  isDisabled={busy || !suggestion?.suggestedOrderIds.length}
                  onPress={createFromSuggestion}
                >
                  Create pickup group
                </Button>
              </div>
              {suggestion ? (
                <div className="text-sm">
                  <p>
                    Suggested {suggestion.suggestedOrderIds.length} / max{" "}
                    {suggestion.maxBatchSize}
                  </p>
                  <ul className="mt-1 list-disc pl-5">
                    {suggestion.suggestedOrderIds.map((id) => (
                      <li key={id}>Order #{id.slice(-8)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card.Content>
          </Card>

          <div className="panel-filter-bar">
            <input
              type="search"
              aria-label="Search pickup groups"
              placeholder="Find a group or order…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {["active", "open", "assigned", "in_progress", "all"].map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {value === "in_progress"
                    ? "On the way"
                    : value.replace(/^./, (c) => c.toUpperCase())}
                </button>
              ),
            )}
          </div>
          <div className="flex flex-col gap-3">
            {visibleBatches.map((batch) => {
              const id = entityId(batch);
              const orderIds = (batch.orderIds ?? []).map((oid) => String(oid));
              return (
                <Card key={id} className="p-4">
                  <Card.Content className="flex flex-col gap-2 p-0">
                    <div className="flex flex-wrap justify-between gap-2">
                      <Typography type="h3" className="font-medium">
                        <span className="panel-status">
                          {batch.status.replaceAll("_", " ")}
                        </span>
                      </Typography>
                      <span className="text-muted text-xs">
                        {orderIds.length} orders · preparation weight{" "}
                        {batch.totalPrepWeight}
                      </span>
                    </div>
                    <p className="text-muted text-xs">
                      Pickup group #{id.slice(-8)}
                    </p>
                    {batch.courierId ? (
                      <p className="text-sm">
                        Courier:{" "}
                        {couriers.find(
                          (c) => c.userId === String(batch.courierId),
                        )?.name ?? `#${String(batch.courierId).slice(-8)}`}
                      </p>
                    ) : null}
                    <ul className="space-y-1 text-sm">
                      {orderIds.map((orderId) => (
                        <li key={orderId}>
                          <Input
                            label={<>Order #{orderId.slice(-8)}</>}
                            wrapperClassName="flex items-center gap-2"
                            type="checkbox"
                            disabled={busy || batch.status !== "open"}
                            checked={(keepByBatch[id] ?? []).includes(orderId)}
                            onChange={() => toggleKeep(id, orderId)}
                          />
                        </li>
                      ))}
                    </ul>
                    <Button
                      size="sm"
                      variant="secondary"
                      isDisabled={
                        busy ||
                        batch.status !== "open" ||
                        !keepByBatch[id]?.length ||
                        keepByBatch[id]?.length === orderIds.length
                      }
                      onPress={() => reduceBatch(id)}
                    >
                      Keep selected orders
                    </Button>
                    {batch.status === "open" && !batch.courierId ? (
                      <FormScope>
                        <div className="flex flex-col gap-2 pt-2">
                          <RadioField
                            label="Assign courier"
                            value={courierByBatch[id] ?? ""}
                            onChange={(value) => setCourierByBatch((previous) => ({ ...previous, [id]: value }))}
                            options={couriers.map((courier) => ({
                              id: courier.userId,
                              label: `${courier.name}${courier.vehicleType ? ` · ${courier.vehicleType.replace("e-bike", "E-bike")}` : ""}`,
                            }))}
                            className="grid max-h-64 gap-3 overflow-y-auto rounded-2xl border border-border p-4 sm:grid-cols-2"
                            required
                            disabled={busy}
                          />
                          {!couriers.length && <p className="text-muted text-sm">No couriers on duty. Ask a courier to start a shift, then refresh.</p>}
                          <FormAction
                            size="sm"
                            variant="primary"
                            isDisabled={busy || !courierByBatch[id]}
                            onPress={() => assignCourier(id)}
                          >
                            Assign courier
                          </FormAction>
                        </div>
                      </FormScope>
                    ) : null}
                  </Card.Content>
                </Card>
              );
            })}
            {!loaded && !error && (
              <p role="status" className="panel-notice">
                Loading pickup groups…
              </p>
            )}
            {loaded && batches.length > 0 && !visibleBatches.length && (
              <p role="status" className="panel-notice">
                No pickup groups match. Try another stage or clear your search.
              </p>
            )}
            {loaded && !batches.length ? (
              <p className="panel-notice">
                No pickup groups yet. Finish the quality checks in the kitchen,
                then find ready orders above.
              </p>
            ) : null}
          </div>
        </div>
      }
    </FormScope>
  );
}
