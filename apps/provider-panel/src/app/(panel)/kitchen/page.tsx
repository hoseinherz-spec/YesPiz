"use client";
import { FormAction, FormScope, Input } from "@repo/ui/forms";

import { QrCode } from "@repo/api/components/qr-code";
import { ProofUpload } from "@repo/api/components/proof-upload";

import {
  ApiError,
  ordersClient,
  qualityClient,
  proofClient,
  type KitchenStatusUpdate,
  type Order,
  type ProviderQualityView,
} from "@repo/api";
import { Button, Card, Typography } from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { requireProviderToken } from "@/lib/auth";
import { entityId, formatCents } from "@/lib/ids";

const BASE_CHECKS = [
  "Weight check",
  "Packaging seal",
  "Temperature",
  "Allergen review",
];

const ACTIONS: Array<{
  status: KitchenStatusUpdate;
  label: string;
  from: string[];
}> = [
  {
    status: "PREPARING",
    label: "Start preparing",
    from: ["ACCEPTED_BY_PROVIDER"],
  },
  {
    status: "READY_FOR_PICKUP",
    label: "Mark ready",
    from: ["PREPARING"],
  },
  {
    status: "EXCEPTION_REPORTED",
    label: "Report exception",
    from: ["ACCEPTED_BY_PROVIDER", "PREPARING"],
  },
];

function checklistItemsForOrder(order: Order): string[] {
  const lineChecks = (order.lines ?? []).map(
    (line) => `${line.name} — recipe verified`,
  );
  return [
    ...new Set([...lineChecks, ...(order.requiredChecklist ?? BASE_CHECKS)]),
  ];
}

export default function KitchenPage() {
  const [pickupCodes, setPickupCodes] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [quality, setQuality] = useState<ProviderQualityView | null>(null);
  const [checkedByOrder, setCheckedByOrder] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [sealByOrder, setSealByOrder] = useState<Record<string, string>>({});
  const [photoByOrder, setPhotoByOrder] = useState<Record<string, string>>({});
  const [qualityByOrder, setQualityByOrder] = useState<
    Record<
      string,
      { checklistDone: boolean; sealDone: boolean; photoDone: boolean }
    >
  >({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = requireProviderToken();
      const [list, me] = await Promise.all([
        ordersClient.listKitchen({ accessToken: token }),
        qualityClient.getMe({ accessToken: token }),
      ]);
      setOrders(list);
      setQuality(me);

      setQualityByOrder((prev) => {
        const next = { ...prev };
        for (const order of list) {
          const id = entityId(order);
          if (!next[id]) {
            next[id] = {
              checklistDone: Boolean(order.checklistCompletedAt),
              sealDone: Boolean(order.sealId),
              photoDone: Boolean(order.readyPhotoUrl),
            };
          }
        }
        return next;
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load kitchen",
      );
    }
  }, []);

  useEffect(() => {
    const boot = window.setTimeout(() => {
      void load();
    }, 0);
    const id = window.setInterval(() => {
      load().catch(() => undefined);
    }, 10000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(id);
    };
  }, [load]);

  const checklistByOrderId = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const order of orders) {
      map[entityId(order)] = checklistItemsForOrder(order);
    }
    return map;
  }, [orders]);

  function toggleCheck(orderId: string, item: string) {
    setCheckedByOrder((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] ?? {}),
        [item]: !(prev[orderId]?.[item] ?? false),
      },
    }));
  }

  function allChecked(orderId: string): boolean {
    const items = checklistByOrderId[orderId] ?? [];
    const checked = checkedByOrder[orderId] ?? {};
    return items.length > 0 && items.every((item) => checked[item] === true);
  }

  async function submitChecklist(orderId: string) {
    const items = checklistByOrderId[orderId] ?? [];
    if (!allChecked(orderId)) {
      setError("Confirm every checklist item before submitting");
      return;
    }

    setBusyId(orderId);
    setError(null);
    try {
      const token = requireProviderToken();
      await qualityClient.submitChecklist(
        orderId,
        {
          answers: items.map((item) => ({ item, ok: true })),
        },
        { accessToken: token },
      );
      setQualityByOrder((prev) => ({
        ...prev,
        [orderId]: { ...prev[orderId], checklistDone: true },
      }));
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Checklist submit failed",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function submitSeal(orderId: string) {
    const sealId = (sealByOrder[orderId] ?? "").trim();
    if (!sealId) {
      setError("Enter a numbered seal ID");
      return;
    }

    setBusyId(orderId);
    setError(null);
    try {
      const token = requireProviderToken();
      await qualityClient.submitSeal(
        orderId,
        { sealId },
        { accessToken: token },
      );
      setQualityByOrder((prev) => ({
        ...prev,
        [orderId]: { ...prev[orderId], sealDone: true },
      }));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Seal submit failed");
    } finally {
      setBusyId(null);
    }
  }

  async function submitPhoto(orderId: string) {
    const photoUrl = (photoByOrder[orderId] ?? "").trim();
    if (!photoUrl) {
      setError("Upload a ready photo first");
      return;
    }

    setBusyId(orderId);
    setError(null);
    try {
      const token = requireProviderToken();
      await qualityClient.submitReadyPhoto(
        orderId,
        { photoUrl },
        { accessToken: token },
      );
      setQualityByOrder((prev) => ({
        ...prev,
        [orderId]: { ...prev[orderId], photoDone: true },
      }));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Photo submit failed");
    } finally {
      setBusyId(null);
    }
  }

  async function markReady(orderId: string) {
    const q = qualityByOrder[orderId];
    if (!q?.checklistDone) {
      setError("Complete and submit the quality checklist first");
      return;
    }
    if (!q?.sealDone) {
      setError("Submit the numbered seal first");
      return;
    }

    setBusyId(orderId);
    setError(null);
    try {
      const token = requireProviderToken();
      await ordersClient.updateKitchenStatus(
        orderId,
        { status: "READY_FOR_PICKUP" },
        { accessToken: token },
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Ready update failed — complete all required quality gates",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function updateStatus(orderId: string, status: KitchenStatusUpdate) {
    if (status === "READY_FOR_PICKUP") {
      await markReady(orderId);
      return;
    }

    setBusyId(orderId);
    setError(null);
    try {
      const token = requireProviderToken();
      await ordersClient.updateKitchenStatus(
        orderId,
        { status },
        { accessToken: token },
      );
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <FormScope>
      {
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Typography type="h1" className="text-2xl font-semibold">
                Active kitchen
              </Typography>
              <p className="text-muted text-sm">
                Confirm each quality check explicitly before handoff
              </p>
            </div>
            <Button size="sm" variant="secondary" onPress={load}>
              Refresh
            </Button>
          </div>

          {quality ? (
            <Card className="p-4">
              <Card.Content className="flex flex-col gap-1 p-0 text-sm">
                <Typography type="h3" className="font-medium">
                  Handoff standards
                </Typography>
                <p>
                  Complete the pizza preparation and packaging checks for every
                  order.
                </p>
                {quality.autoSuspended ? (
                  <p className="text-danger">
                    Suspended — contact Yespizz operations to review the next
                    steps.
                  </p>
                ) : null}
              </Card.Content>
            </Card>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          {!orders.length ? (
            <Card className="p-4">
              <Card.Content className="text-muted p-0 text-sm">
                No active kitchen orders
              </Card.Content>
            </Card>
          ) : null}

          {orders.map((order) => {
            const id = entityId(order);
            const items = checklistByOrderId[id] ?? [];
            const q = qualityByOrder[id];
            const preparing = order.status === "PREPARING";

            return (
              <Card key={id} className="p-4">
                <Card.Content className="flex flex-col gap-2 p-0">
                  <div className="flex flex-wrap justify-between gap-2">
                    <Typography type="h3" className="font-medium">
                      {order.status}
                    </Typography>
                    <span className="text-sm">
                      {formatCents(order.totalCents)}
                    </span>
                  </div>
                  <p className="text-muted text-xs">Order {id}</p>
                  <ul className="text-sm">
                    {(order.lines ?? []).map((line, idx) => (
                      <li key={`${id}-${idx}`}>
                        {line.quantity}× {line.name} ·{" "}
                        {line.selectionLabels?.length
                          ? line.selectionLabels.join(" · ")
                          : (line.size ?? "medium")}
                        {line.extras?.length
                          ? ` · ${line.extras.join(", ")}`
                          : ""}
                      </li>
                    ))}
                  </ul>

                  {order.status === "ASSIGNED_TO_COURIER" ? (
                    <div className="rounded-md border border-border p-3">
                      <p>
                        Read this pickup code to the assigned courier after
                        checking the seal.
                      </p>
                      {pickupCodes[id] ? (
                        <strong className="text-2xl tracking-widest">
                          <QrCode value={pickupCodes[id]} />
                          {pickupCodes[id]}
                        </strong>
                      ) : (
                        <Button
                          onPress={async () => {
                            try {
                              const codes = await proofClient.getPickupCodes(
                                id,
                                {
                                  accessToken: requireProviderToken(),
                                },
                              );
                              setPickupCodes((prev) => ({
                                ...prev,
                                [id]: codes.pickupCode,
                              }));
                            } catch (err) {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Unable to load pickup code",
                              );
                            }
                          }}
                        >
                          Show pickup code
                        </Button>
                      )}
                    </div>
                  ) : null}
                  {preparing ? (
                    <FormScope>
                      <div className="border-border flex flex-col gap-3 rounded-md border p-3">
                        <Typography type="h3" className="text-sm font-medium">
                          Quality checklist
                        </Typography>
                        {q?.checklistDone ? (
                          <p className="text-muted text-sm">
                            Checklist submitted
                          </p>
                        ) : (
                          <>
                            <ul className="space-y-2 text-sm">
                              {items.map((item) => (
                                <li key={item}>
                                  <Input
                                    label={
                                      <>
                                        <span>{item}</span>
                                      </>
                                    }
                                    wrapperClassName="flex items-start gap-2"
                                    type="checkbox"
                                    checked={
                                      checkedByOrder[id]?.[item] === true
                                    }
                                    onChange={() => toggleCheck(id, item)}
                                  />
                                </li>
                              ))}
                            </ul>
                            <FormAction
                              size="sm"
                              variant="secondary"
                              isDisabled={busyId === id || !allChecked(id)}
                              onPress={() => submitChecklist(id)}
                            >
                              Submit checklist
                            </FormAction>
                          </>
                        )}

                        <FormScope>
                          <div className="flex flex-col gap-2">
                            <Typography
                              type="h3"
                              className="text-sm font-medium"
                            >
                              Numbered seal
                            </Typography>
                            {q?.sealDone ? (
                              <p className="text-muted text-sm">
                                Seal recorded
                                {order.sealId ? `: ${order.sealId}` : ""}
                              </p>
                            ) : (
                              <>
                                <Input
                                  aria-label="Seal ID"
                                  placeholder="Seal ID on package"
                                  value={sealByOrder[id] ?? ""}
                                  onChange={(e) =>
                                    setSealByOrder((prev) => ({
                                      ...prev,
                                      [id]: e.target.value,
                                    }))
                                  }
                                  className="border-border bg-background rounded-md border px-3 py-2 text-sm"
                                />
                                <FormAction
                                  size="sm"
                                  variant="secondary"
                                  isDisabled={
                                    busyId === id || !q?.checklistDone
                                  }
                                  onPress={() => submitSeal(id)}
                                >
                                  Submit seal
                                </FormAction>
                              </>
                            )}
                          </div>
                        </FormScope>

                        <div className="flex flex-col gap-2">
                          <Typography type="h3" className="text-sm font-medium">
                            Ready photo (when required)
                          </Typography>
                          {q?.photoDone ? (
                            <p className="text-muted text-sm">Photo saved</p>
                          ) : (
                            <>
                              <ProofUpload
                                orderId={id}
                                accessToken={requireProviderToken()}
                                purpose="ready"
                                onUploaded={(reference) =>
                                  setPhotoByOrder((prev) => ({
                                    ...prev,
                                    [id]: reference,
                                  }))
                                }
                              />
                              <FormAction
                                size="sm"
                                variant="secondary"
                                isDisabled={busyId === id}
                                onPress={() => submitPhoto(id)}
                              >
                                Submit ready photo
                              </FormAction>
                            </>
                          )}
                        </div>
                      </div>
                    </FormScope>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {ACTIONS.filter((a) => a.from.includes(order.status)).map(
                      (action) => (
                        <Button
                          key={action.status}
                          size="sm"
                          variant={
                            action.status === "EXCEPTION_REPORTED"
                              ? "secondary"
                              : "primary"
                          }
                          isDisabled={
                            busyId === id ||
                            (action.status === "READY_FOR_PICKUP" &&
                              (!q?.checklistDone || !q?.sealDone))
                          }
                          onPress={() => updateStatus(id, action.status)}
                        >
                          {action.label}
                        </Button>
                      ),
                    )}
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      }
    </FormScope>
  );
}
