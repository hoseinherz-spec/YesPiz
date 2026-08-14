# Yespizz — Product Brief

Canonical product strategy (Persian): [`prd/product-strategy.md`](../prd/product-strategy.md).

This file is the engineering-facing summary. Use it when choosing what to build next.

## Promise

The menu is not the advantage. The promise is:

> The customer gets a standard, reliable order at a stated time — without choosing a restaurant.

The brand owns the whole experience. Kitchen identity is never shown to the customer. Every quality miss is a Yespizz miss.

Build around **consistent quality**, **success-probability dispatch**, and **error-free operations**.

## Differentiating bets

1. **Same quality regardless of kitchen** — recipes, weight, pack, seal, temperature, internal score, auto-suspend.
2. **Assign by probability of a successful delivery** — not nearest kitchen, not fastest click.
3. **Automatic make-good** — if an order misses SLA, credit or discount without support.

## Priority

### P0 — MVP core

| Feature | Expected result | Primary surfaces |
|---|---|---|
| Kitchen Quality OS | Same taste, weight, pack, quality across kitchens | Admin, provider, API |
| Live capacity & inventory | Fewer rejects and delays | Provider, API |
| Honest ETA | Real prep + delivery window | API → mobile |
| Provable delivery chain | Fewer lost/wrong/denied deliveries | Courier, provider, mobile |
| Safe smart batching | Lower cost without cold pizza | API, provider, courier |
| Incident command center | Fast handling of crash, no-answer, no-pay | Courier, admin |

Cash Trust is listed P1 in the strategy doc but is required to keep cash from becoming a debt engine. Treat the **score + ladder** as P1; treat **no cash above €500** and a working failed-cash path as P0 hygiene.

### P1 — trust and repeat

| Feature | Expected result | Primary surfaces |
|---|---|---|
| Cash Trust Score | Less debt and abuse | API, mobile, admin |
| Kitchen & courier performance | Continuous ops improvement | Admin |
| Delivery guarantee + auto compensate | Customer trust | API, mobile |
| Reorder, loyalty, subscription | Retention | Mobile, website |

### After MVP

Group orders, split pay, free-delivery subscription, ads, predictive ML beyond history-based ETA.

## Target dispatch (replaces first-accept-wins)

Current code broadcasts to top-N and the first Accept wins. That rewards click speed over capacity.

Target wave:

1. Offer the order to the top 3 kitchens.
2. Each has 10–20 seconds to declare readiness and a prep time.
3. The server picks the best respondent.
4. If nobody responds, expand radius and N.

Score inputs: distance, quoted prep time, queue capacity, delay rate, error rate, quality score, recent volume, accept probability, fairness weight.

Kitchens never choose the winner.

## Non-negotiables

1. If a feature does not strengthen quality, assignment, or operations, it is not MVP.
2. No customer-facing API may leak kitchen name, address, coordinates, logo, or id.
3. Pricing, ranking, compensation, and state transitions are server-side only.
4. Every courier incident action must start a workflow, not just a report.
5. When batching is uncertain, prefer a single order. Soft pizza beats utilization.
6. Cash is a trust privilege, not a default right.

## Current vs target

The marketplace skeleton is shipped: admin menu, pay, offer, kitchen, batch through courier assign, blind courier location.

The promise is not shipped yet. See the gap table in [`prd/product-strategy.md`](../prd/product-strategy.md#۸-وضعیت-فعلی-در-برابر-هدف) and the phase plan in [`SERVICES.md`](SERVICES.md).
