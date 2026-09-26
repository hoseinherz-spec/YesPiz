"use client";
import { Form, Select, Input } from "@/components/AdminForms";

import { useState } from "react";
import { Button } from "@heroui/react";
import { financeClient } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
export function PayoutAccount({ configured }: { configured: boolean }) {
  const [party, setParty] = useState("provider");
  const [payeeId, setPayeeId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function bind() {
    setBusy(true);
    setNotice("");
    try {
      await financeClient.bindAccount(
        { party, payeeId, accountId },
        { accessToken: requireAdminToken() },
      );
      setNotice(
        "Verified Stripe account connected. New automatic settlements will use this destination.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to connect account.");
    } finally {
      setBusy(false);
    }
  }
  const field = "mt-2 w-full rounded-xl bg-field-background p-3";
  return (
    <section className="rounded-3xl bg-card p-6">
      <h2 className="text-xl font-semibold">
        Connect a partner payout account
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Use an onboarded Stripe Connect account with transfers and payouts
        enabled. Set its Stripe metadata “yespizzUserId” to the partner’s user
        ID. The server verifies the match. Approved settlements retain their
        original destination if an account is changed later.
      </p>
      {!configured ? (
        <p className="mt-4 text-sm">
          Automatic transfers are disabled. Configure Stripe Connect on the
          server first.
        </p>
      ) : (
        <Form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void bind();
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              label={<>Partner role</>}
              wrapperClassName="text-sm"
              value={party}
              onChange={(e) => setParty(e.target.value)}
              className={field}
            >
              <option value="provider">Restaurant</option>
              <option value="courier">Courier</option>
            </Select>
            <Input
              entity={party === "provider" ? "provider" : "courier"}
              label={
                <>{party === "provider" ? "Provider ID" : "Courier user ID"}</>
              }
              wrapperClassName="text-sm"
              required
              value={payeeId}
              onChange={(e) => setPayeeId(e.target.value)}
              className={field}
            />
            <Input
              label={<>Stripe account ID</>}
              wrapperClassName="text-sm"
              required
              placeholder="acct_…"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={field}
            />
          </div>
          <Button type="submit" isDisabled={busy}>
            Verify & connect
          </Button>
        </Form>
      )}
      {notice && (
        <p role="status" className="mt-4 text-sm">
          {notice}
        </p>
      )}
    </section>
  );
}
