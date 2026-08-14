# Yespizz — Courier app

Workspace: `apps/courier-mobile` · http://localhost:8053

Couriers close the provable delivery chain and start incident workflows. A report button is not enough; each action must create a workflow.

Product: [`docs/PRODUCT.md`](../../docs/PRODUCT.md) · strategy: [`prd/product-strategy.md`](../../prd/product-strategy.md).

## Role

- Scan kitchen QR / OTP, confirm seal, record pickup time and geo.
- Carry at most 3 orders; never hold food past the batch wait limit.
- Collect door PIN, signature, or photo; digital cash receipt when needed.
- Tell the customer only that there is one short extra stop — never other customers or kitchens.
- Run incident workflows: crash, no-answer, no-pay, wrong address, damaged pack, vehicle, SOS.

## Shipped

| Route | What it does |
|---|---|
| `/login` | Courier auth |
| `/home` | Session start/end (any non-empty start code), location share, assigned batch list (read-only) |

Pickup, transit, delivery, proof, cash collection, and incidents are not implemented. Order statuses after `ASSIGNED_TO_COURIER` are not reachable.

## Next (P0)

- Validated pickup QR / OTP + seal + geo
- `PICKED_UP` → `ON_THE_WAY` → `DELIVERED` → `COMPLETED`
- Door PIN / sign / photo; cash receipt
- Safe batch navigation + auto-split when one order slips
- Incident actions, each with a workflow (replacement courier, wait timer, debt, SOS)

## Development

From the monorepo root:

```sh
npm run dev:courier
```

Capacitor static export. API: `NEXT_PUBLIC_API_URL` (default `http://localhost:8058`).

```sh
npm run lint --workspace=courier-mobile
npm run check-types --workspace=courier-mobile
npm run build --workspace=courier-mobile
```
