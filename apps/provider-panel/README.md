# Yespizz — Provider panel

Workspace: `apps/provider-panel` · http://localhost:8084

Partner kitchens execute the brand standard. They do not win orders by clicking first. They declare capacity, readiness, and a prep time; the server assigns the winner.

Product: [`docs/PRODUCT.md`](../../docs/PRODUCT.md) · strategy: [`prd/product-strategy.md`](../../prd/product-strategy.md).

## Role

- Follow the Kitchen Quality OS (recipe, weight, cook time, temperature, numbered seal, checklist, ready photo).
- Set accept capacity, 86 items, pause new orders, override prep time, mark ready.
- In a wave: respond in 10–20 seconds with ready + prep minutes. Do not race Accept.
- Reduce a batch; never add. Split if food would wait too long.
- Hand off to the courier with QR / OTP. Never appear in the customer app.

## Shipped

| Route | What it does |
|---|---|
| `/offers` | Accept / reject; poll every 8s. First Accept still wins (Phase 1) |
| `/kitchen` | `PREPARING` → `READY_FOR_PICKUP` or `EXCEPTION_REPORTED` |
| `/batches` | Suggest / create / reduce. No assign-courier UI (API exists) |

`acceptingOrders` can be patched via API; there is no panel screen. No recipes, seals, photos, item 86, or per-order prep override.

## Next (P0)

- Wave response UI (ready + quoted prep) instead of first-accept
- Capacity, pause, item 86, per-order prep
- Checklist, seal id, ready photo before handoff
- Assign courier + pickup QR / OTP
- Quality score and suspend state (read-only; admin/API enforce)

## Development

From the monorepo root:

```sh
npm run dev:provider
```

```sh
npm run lint --workspace=provider-panel
npm run check-types --workspace=provider-panel
npm run build --workspace=provider-panel
```
