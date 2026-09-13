"use client";
import { Form, Input, Select } from "@repo/ui/forms";

import { DiscountCodes } from "@/components/DiscountCodes";
import { ReferralProgram } from "@/components/ReferralProgram";
import { growthClient, type Campaign, type GrowthDashboard } from "@repo/api";
import { Button } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { requireAdminToken } from "@/lib/auth";
const money = (n: number) => `€${(n / 100).toFixed(2)}`;
export default function GrowthPage() {
  const [data, setData] = useState<GrowthDashboard | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState("local");
  const [audience, setAudience] = useState("new");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [budget, setBudget] = useState("");
  const load = useCallback(async () => {
    try {
      setData(
        await growthClient.dashboard({ accessToken: requireAdminToken() }),
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load growth.");
    }
  }, []);
  useEffect(() => {
    // Defer initial loading so synchronous auth/storage failures update after the effect.
    void Promise.resolve().then(load);
  }, [load]);
  async function create() {
    setBusy(true);
    setError("");
    try {
      await growthClient.campaign(
        {
          name,
          code,
          channel,
          audience,
          startAt: new Date(start).toISOString(),
          endAt: new Date(end).toISOString(),
          budgetCents: Math.round(Number(budget) * 100),
        },
        { accessToken: requireAdminToken() },
      );
      setName("");
      setCode("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create campaign.");
    } finally {
      setBusy(false);
    }
  }
  const field =
    "mt-2 w-full rounded-xl bg-field-background p-3 text-foreground";
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Marketing workspace</p>
          <h1 className="mt-2 text-3xl font-semibold">
            Grow from delivered pizzas
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Plan campaigns and track attributed completed orders. Budgets and
            actual spend are recorded here; advertising is managed in your
            chosen channel.
          </p>
        </div>
        <Button variant="secondary" onPress={() => void load()}>
          Refresh
        </Button>
      </header>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {data && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Customers with a completed order", data.customers.customers],
            [
              "Customers with 2+ completed orders",
              data.customers.repeatCustomers,
            ],
            ["No completed order in 30 days", data.customers.lapsedCustomers],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl bg-card p-6">
              <p className="text-4xl font-semibold tabular-nums">{value}</p>
              <p className="mt-3 text-sm text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
        className="rounded-3xl border border-border p-6"
      >
        <h2 className="text-xl font-semibold">Plan a campaign</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label={<>Campaign name</>}
            wrapperClassName="text-sm"
            required
            minLength={3}
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
          />
          <Input
            label={<>Tracking code</>}
            wrapperClassName="text-sm"
            required
            pattern="[a-z0-9-]{3,40}"
            title="3–40 lowercase letters, numbers or hyphens"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={field}
          />
          <Select
            label={<>Channel</>}
            wrapperClassName="text-sm"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className={field}
          >
            {[
              "local",
              "search",
              "social",
              "referral",
              "business",
              "retention",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
          <Select
            label={<>Intended audience</>}
            wrapperClassName="text-sm"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className={field}
          >
            {["new", "returning", "lapsed", "business"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
          <Input
            label={<>Starts</>}
            wrapperClassName="text-sm"
            required
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={field}
          />
          <Input
            label={<>Ends</>}
            wrapperClassName="text-sm"
            required
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className={field}
          />
          <Input
            label={<>Planned budget (€)</>}
            wrapperClassName="text-sm"
            required
            type="number"
            min="0"
            max="1000000"
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={field}
          />
        </div>
        <Button className="mt-5" type="submit" isDisabled={busy}>
          Save campaign plan
        </Button>
      </Form>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Campaign performance</h2>
        {data?.campaigns.length === 0 && (
          <p className="text-muted">
            Create a campaign to start tracking its pizza orders.
          </p>
        )}
        {data?.campaigns.map((campaign) => (
          <CampaignRow
            key={campaign._id}
            campaign={campaign}
            stats={data.attribution.find((row) => row._id === campaign.code)}
            onSaved={load}
          />
        ))}
      </section>
      <DiscountCodes />
      <ReferralProgram />
    </div>
  );
}
function CampaignRow({
  campaign,
  stats,
  onSaved,
}: {
  campaign: Campaign;
  stats?: GrowthDashboard["attribution"][number];
  onSaved: () => Promise<void>;
}) {
  const [status, setStatus] = useState(campaign.status);
  const [spend, setSpend] = useState(String(campaign.spendCents / 100));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setError("");
    try {
      await growthClient.updateCampaign(
        campaign._id,
        { status, spendCents: Math.round(Number(spend) * 100) },
        { accessToken: requireAdminToken() },
      );
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="rounded-3xl bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{campaign.name}</h3>
          <p className="mt-1 text-sm text-muted">
            {campaign.channel} · {campaign.audience} ·{" "}
            {new Date(campaign.startAt).toLocaleDateString()}–
            {new Date(campaign.endAt).toLocaleDateString()}
          </p>
        </div>
        <span className="text-sm">Budget {money(campaign.budgetCents)}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-6 text-sm">
        <span>
          <strong>{stats?.orders ?? 0}</strong> completed orders
        </span>
        <span>
          <strong>{stats?.customers ?? 0}</strong> attributed customers
        </span>
        <span>
          <strong>{money(stats?.orderValueCents ?? 0)}</strong> order value
        </span>
        <span>
          <strong>
            {stats?.customers
              ? money(campaign.spendCents / stats.customers)
              : "—"}
          </strong>{" "}
          spend / attributed customer
        </span>
      </div>
      <p className="mt-4 break-all text-xs text-muted">
        Customer app link: /home/?campaign={campaign.code}
      </p>
      <p className="mt-1 text-xs text-muted">
        Append this path to your customer app domain. Attribution is active only
        within the campaign dates. This is not a discount code.
      </p>
      <Form
        className="mt-5 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Select
          label={<>Status</>}
          wrapperClassName="text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as Campaign["status"])}
          className="ml-2 rounded-xl bg-field-background p-3"
        >
          {["planned", "active", "completed"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </Select>
        <Input
          label={<>Actual spend (€)</>}
          wrapperClassName="text-sm"
          required
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          value={spend}
          onChange={(e) => setSpend(e.target.value)}
          className="ml-2 w-32 rounded-xl bg-field-background p-3"
        />
        <Button variant="secondary" isDisabled={busy} type="submit">
          Save
        </Button>
      </Form>
      {error && (
        <p role="alert" className="mt-3 text-danger">
          {error}
        </p>
      )}
    </article>
  );
}
