"use client";
import { DataList } from "@/components/AdminTable";
import { Form, Input } from "@/components/AdminForms";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { referralsClient, type ReferralReview } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
export function ReferralProgram() {
  const [rows, setRows] = useState<ReferralReview[]>([]);
  const [reward, setReward] = useState("0");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const options = { accessToken: requireAdminToken() };
      const [queue, settings] = await Promise.all([
        referralsClient.queue(options),
        referralsClient.settings(options),
      ]);
      setRows(queue);
      setReward((settings.rewardCents / 100).toFixed(2));
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load referrals.");
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  async function configure() {
    setBusy(true);
    setError("");
    try {
      await referralsClient.configure(Math.round(Number(reward) * 100), {
        accessToken: requireAdminToken(),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  async function approve(id: string) {
    setBusy(true);
    setError("");
    try {
      await referralsClient.approve(id, { accessToken: requireAdminToken() });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to approve.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5 rounded-3xl bg-card p-6">
      <h2 className="text-xl font-semibold">Referral rewards</h2>
      <p className="max-w-2xl text-sm leading-6 text-muted">
        Set the credit for each side of a new referral. €0 pauses new referrals;
        existing promises retain their amount. Approve only after reviewing the
        completed paid order and checking the accounts for abuse. This credits
        both wallets, not a bank transfer.
      </p>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {!loaded ? (
        <p role="status">Loading referrals…</p>
      ) : (
        <>
          <Form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void configure();
            }}
          >
            <Input
              label={<>Credit per person (€)</>}
              wrapperClassName="text-sm"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="mt-2 block rounded-xl bg-field-background p-3"
            />
            <Button type="submit" isDisabled={busy}>
              Save referral reward
            </Button>
          </Form>
          <div className="space-y-3">
            {!rows.length && (
              <p className="text-sm text-muted">No referrals yet.</p>
            )}
            <DataList
              data={rows}
              label="referrals"
              renderItem={(row) => (
                <article
                  key={row._id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-4"
                >
                  <div>
                    <p className="text-sm">
                      Invitee {row.inviteeId} · Referrer {row.inviterId}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      €{(row.rewardCents / 100).toFixed(2)} each · {row.status}{" "}
                      ·{" "}
                      {row.eligible
                        ? "Qualifying paid delivery found"
                        : "Awaiting qualifying delivery"}
                    </p>
                  </div>
                  {row.status !== "rewarded" && (
                    <Button
                      variant="secondary"
                      isDisabled={busy || !row.eligible}
                      onPress={() => void approve(row._id)}
                    >
                      Approve both credits
                    </Button>
                  )}
                </article>
              )}
            />
          </div>
        </>
      )}
    </section>
  );
}
