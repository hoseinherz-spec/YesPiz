# Yespizz — Admin / ops

Workspace: `apps/admin` · http://localhost:8052

Admin owns the menu, the quality bar, dispatch weights, crisis handling, and compensation. Because the customer never sees the kitchen, this panel is where the brand is actually operated.

Product: [`docs/PRODUCT.md`](../../docs/PRODUCT.md) · strategy: [`prd/product-strategy.md`](../../prd/product-strategy.md).

## Role

- Publish one menu version; define recipes, weights, cook/temp, pack and seal rules.
- Score kitchens from complaints, delays, and errors; auto-suspend; run test orders.
- Simulate dispatch weights before applying them. Reassign in-flight orders.
- Run the incident command center (crash, no-answer, no-pay, SOS).
- Restore Cash Trust after settlement. Never allow cash above €500.
- Watch live map, at-risk ETAs, on-time rate, errors, profit, fraud.

## Shipped

| Route | What it does |
|---|---|
| `/menu` | Versions, categories, items, publish |
| `/providers` | CRUD, pause (`acceptingOrders`), deactivate |
| `/config` | Dispatch weights, radii, timeout, cash fail threshold, batch size |
| `/exceptions` | Resolve kitchen exceptions |

No live map, order list, reassign, metrics, cash-ban restore, or formula sandbox.

## Next (P0 / P1)

- Quality OS: standards, test orders, auto-suspend rules
- Wave-dispatch config (top-3, 10–20s bid, fairness) + weight simulator
- Live map, at-risk queue, manual reassign
- Full order history and proof timeline
- Incident console
- Cash Trust + €500 cap + unban
- Kitchen/courier KPIs (accept/reject, wait, on-time, error, complaint, profit)

## Development

From the monorepo root:

```sh
npm run dev:admin
```

```sh
npm run lint --workspace=admin
npm run check-types --workspace=admin
npm run build --workspace=admin
```
