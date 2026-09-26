"use client";
import { FormAction, FormScope, Input } from "@/components/AdminForms";

import {
  ApiError,
  appConfigClient,
  type AppConfig,
  type UpdateAppConfigRequest,
} from "@repo/api";
import { Card, Typography } from "@heroui/react";
import { useCallback, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
import { useLoadOnMount } from "@/lib/load-on-mount";

const FIELDS: Array<{
  key: keyof UpdateAppConfigRequest;
  label: string;
  step?: string;
}> = [
  { key: "deliveryFeeCents", label: "deliveryFeeCents (cents)", step: "1" },
  {
    key: "smallSizeDeltaCents",
    label: "smallSizeDeltaCents (cents)",
    step: "1",
  },
  {
    key: "mediumSizeDeltaCents",
    label: "mediumSizeDeltaCents (cents)",
    step: "1",
  },
  {
    key: "largeSizeDeltaCents",
    label: "largeSizeDeltaCents (cents)",
    step: "1",
  },
  { key: "extraCheeseCents", label: "extraCheeseCents (cents)", step: "1" },
  { key: "jalapenosCents", label: "jalapenosCents (cents)", step: "1" },
  { key: "olivesCents", label: "olivesCents (cents)", step: "1" },
  { key: "garlicDipCents", label: "garlicDipCents (cents)", step: "1" },

  { key: "w1Rating", label: "Weight: rating", step: "0.05" },
  { key: "w2Proximity", label: "Weight: proximity", step: "0.05" },
  { key: "w3QueueEmptiness", label: "Weight: queue emptiness", step: "0.05" },
  { key: "dispatchTopN", label: "Dispatch top N", step: "1" },
  {
    key: "dispatchInitialRadiusMeters",
    label: "Initial radius (m)",
    step: "100",
  },
  {
    key: "dispatchExpandedRadiusMeters",
    label: "Expanded radius (m)",
    step: "100",
  },
  { key: "offerTimeoutSeconds", label: "Offer timeout (s)", step: "1" },
  { key: "cashFailThreshold", label: "Cash fail threshold", step: "1" },
  { key: "cashHardCapCents", label: "Cash hard cap (cents)", step: "100" },
  {
    key: "qualityAutoSuspendThreshold",
    label: "Quality auto-suspend score",
    step: "1",
  },
  { key: "maxBatchSize", label: "Max batch size", step: "1" },
];

export default function ConfigPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [draft, setDraft] = useState<UpdateAppConfigRequest>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = requireAdminToken();
    const data = await appConfigClient.get({ accessToken: token });
    setConfig(data);
    setDraft({
      w1Rating: data.w1Rating,
      w2Proximity: data.w2Proximity,
      w3QueueEmptiness: data.w3QueueEmptiness,
      dispatchTopN: data.dispatchTopN,
      dispatchInitialRadiusMeters: data.dispatchInitialRadiusMeters,
      dispatchExpandedRadiusMeters: data.dispatchExpandedRadiusMeters,
      offerTimeoutSeconds: data.offerTimeoutSeconds,
      cashFailThreshold: data.cashFailThreshold,
      cashHardCapCents: data.cashHardCapCents,
      qualityAutoSuspendThreshold: data.qualityAutoSuspendThreshold,
      maxBatchSize: data.maxBatchSize,
    });
  }, []);

  useLoadOnMount(() =>
    load().catch((err) =>
      setError(err instanceof ApiError ? err.message : "Failed to load config"),
    ),
  );

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const token = requireAdminToken();
      const updated = await appConfigClient.update(draft, {
        accessToken: token,
      });
      setConfig(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormScope>
      {
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div>
            <Typography type="h1" className="text-2xl font-semibold">
              App config
            </Typography>
            <p className="text-muted text-sm">
              Dispatch weights, radii, offer timeout, and batch size
            </p>
          </div>

          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}

          <Card className="p-4">
            <FormScope>
              <Card.Content className="flex flex-col gap-3 p-0">
                {!config ? (
                  <p className="text-muted text-sm">Loading…</p>
                ) : (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      {FIELDS.map((field) => (
                        <Input
                          label={<>{field.label}</>}
                          wrapperClassName="flex flex-col gap-1 text-sm"
                          key={field.key}
                          type="number"
                          step={field.step}
                          value={draft[field.key] ?? ""}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              [field.key]: Number(e.target.value),
                            }))
                          }
                          className="border-border bg-background rounded-md border px-3 py-2"
                        />
                      ))}
                    </div>
                    <FormAction
                      variant="primary"
                      isDisabled={busy}
                      onPress={save}
                    >
                      Save changes
                    </FormAction>
                  </>
                )}
              </Card.Content>
            </FormScope>
          </Card>
        </div>
      }
    </FormScope>
  );
}
