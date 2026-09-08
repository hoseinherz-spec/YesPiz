# Multi-user ordering acceptance

## Scope

The catalogue is a central, versioned YesPiz menu administered in the Admin application. Kitchens control their own availability, capacity, item unavailability and fulfilment; they do not publish independent customer-facing menus. Customers receive a blind delivery projection rather than restaurant assignment details.

The new integration scenario uses **three customers, two independent kitchen accounts and two courier accounts**, all registered through actual authentication/invitation APIs, with disposable MongoDB. It submits three purchases, including a two-stop batch containing a card order and a cash order. The separate Stripe suites verify the external payment boundary in sandbox mode.

## Coverage

| Flow | Verification |
| --- | --- |
| Menu creation/publication | Admin creates category/item/version; a kitchen cannot publish; empty publication rejected |
| Menu maintenance | Price update appears on public menu; purchased totals remain snapshots; fractional cents and negative prep weight rejected |
| Customer ownership | Another customer's address/order/payment cannot be used; each customer sees only their orders |
| Restaurant ownership | A nonparticipating restaurant sees no offer; another kitchen cannot change status, obtain pickup codes or assign a courier |
| Order retries | Reusing a customer order idempotency key returns the same order |
| Multi-restaurant batching | Combining orders from different kitchens is rejected |
| Pickup | A different courier cannot collect the order, even with the real pickup code and seal |
| Multi-stop delivery | Both orders are collected before separate customer drop-offs; finishing the first stop leaves the other on the way |
| Delivery proof | Wrong PIN and another courier's delivery submission are rejected; customer PIN is not exposed in courier proof |
| Cash settlement | Completing without receipt is rejected; underpayment is rejected; exact settlement permits completion |
| Completed routes | All delivered batches disappear from the active courier feed |
| Competing kitchens | Concurrent readiness submissions resolve to one restaurant; the losing restaurant cannot control the order |
| Menu replacement | A category from another version is rejected; publishing a replacement prevents stale-menu purchases and preserves purchased totals |

## Fixes discovered

- Cash receipts previously marked an order paid even when the amount was below the total. The API now requires the exact integer-cent amount.
- Courier cash entry displays euros and converts to integer cents at the API boundary; the prefilled total must match the order after giving change.
- Admin menu maintenance had no edit/hide controls despite existing API endpoints. Name/price editing and visibility controls are now available, and category names replace raw category IDs.
- Empty menu publication could replace the current menu with no sellable items. Publication now requires an active item.

## Reproduce

Verified on 2026-09-07: all four API integration suites passed (14 tests). Browser acceptance passed for card delivery, cash delivery, admin/courier shift management and admin menu maintenance. The menu and kitchen screens were also checked at 390px for horizontal overflow. These are separate suites; real Stripe acceptance is recorded in [Stripe sandbox](STRIPE-SANDBOX.md).

The final cash browser rerun passed after the euro-input change, asserting the €16.48 prefill and completing receipt and delivery. Resource-constrained reruns encountered local disk exhaustion; the successful final run used `NODE_OPTIONS=--max-old-space-size=1536`. API unit tests (71), workspace type checks and lint also passed; existing lint warnings remain.

```sh
MONGOMS_SYSTEM_BINARY=/opt/homebrew/bin/mongod npm run test:e2e --workspace=api -- --runInBand --watchman=false
MONGOMS_SYSTEM_BINARY=/opt/homebrew/bin/mongod npm run test:e2e
MONGOMS_SYSTEM_BINARY=/opt/homebrew/bin/mongod npm run test:e2e:admin
```

Browser traces are opt-in (`PLAYWRIGHT_TRACE=1`); full multi-app tracing exhausted local disk during acceptance. Screenshot evidence is generated under `.qa/ui/` and is not committed. This is functional verification, not load testing or a guarantee for every possible combination. Native background behavior and public staging still have the gates listed in [release readiness](RELEASE-READINESS.md).
