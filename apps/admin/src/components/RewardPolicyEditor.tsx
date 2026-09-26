"use client";
import { Form, Input } from "@/components/AdminForms";
import { useCallback, useState } from "react";
import { Button } from "@heroui/react";
import { apiRequest, withAuth } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import { useLoadOnMount } from "@/lib/load-on-mount";
type Policy = {
  version: number;
  ordersPerReward: number;
  rewardCents: number;
  minimumOrderCents: number;
};
export function RewardPolicyEditor() {
  const [policy, setPolicy] = useState<Policy | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setPolicy(
        (
          await apiRequest<{ current: Policy }>(
            "/api/v1/growth/reward-policy",
            withAuth({ accessToken: requireAdminToken() }),
          )
        ).current,
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load reward rules.");
    }
  }, []);
  useLoadOnMount(load);
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Reward rules</h2>
      <p className="mt-2 text-sm text-muted">
        New rules apply to new orders. Existing orders keep their original
        reward terms and earned credit.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-danger">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {policy && (
        <Form
          key={policy.version}
          className="mt-4 grid gap-4 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (busy) return;
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setNotice("");
            void apiRequest<Policy>(
              "/api/v1/growth/reward-policy",
              withAuth({
                accessToken: requireAdminToken(),
                method: "POST",
                body: {
                  version: policy.version,
                  ordersPerReward: Number(f.get("count")),
                  rewardCents: Math.round(Number(f.get("reward")) * 100),
                  minimumOrderCents: Math.round(Number(f.get("minimum")) * 100),
                },
              }),
            )
              .then((p) => {
                setPolicy(p);
                setError("");
                setNotice("New reward rules saved.");
              })
              .catch((e) => setError(e.message))
              .finally(() => setBusy(false));
          }}
        >
          {[
            {
              name: "count",
              label: "Orders per reward",
              value: policy.ordersPerReward,
              min: 1,
              max: 50,
              step: 1,
            },
            {
              name: "reward",
              label: "Credit per reward (€)",
              value: policy.rewardCents / 100,
              min: 1,
              max: 100,
              step: 0.01,
            },
            {
              name: "minimum",
              label: "Minimum order (€)",
              value: policy.minimumOrderCents / 100,
              min: 0,
              max: 1000,
              step: 0.01,
            },
          ].map((f) => (
            <div key={f.name} className="text-sm">
              <Input
                label={<>{f.label}</>}
                name={f.name}
                min={f.min}
                max={f.max}
                step={f.step}
                disabled={busy}
                type="number"
                required
                defaultValue={f.value}
                className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3"
              />
            </div>
          ))}
          <Button type="submit" isDisabled={busy}>
            Save rules
          </Button>
        </Form>
      )}
      <Button variant="ghost" onPress={() => void load()}>
        Refresh rules
      </Button>
    </section>
  );
}
