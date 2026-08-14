# Yespizz — API

Workspace: `apps/api` · http://localhost:8058 · Swagger: http://localhost:8058/api/docs

Single source of truth. Clients do not price, rank, compensate, or choose a kitchen.

Product: [`docs/PRODUCT.md`](../../docs/PRODUCT.md) · architecture: [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) · rollout: [`docs/SERVICES.md`](../../docs/SERVICES.md).

## Role

- Keep kitchen identity off every customer DTO.
- Assign by probability of a successful delivery (target: wave). Phase 1 is still first-accept-wins.
- Own Quality OS scores, ETA windows, proof chain, incident workflows, Cash Trust, and SLA compensation.
- Never trust the client for money, rank, or status.

## Shipped

Catalog, providers, orders through kitchen ready, dispatch (top-N race, 90s, one radius expand), payments (Stripe or mock + cash ban flag), courier session stub + location, batches through assign, app-config, Socket.IO, push stub.

Happy path in tests ends at **courier assigned + blind location**. `PICKED_UP` → `COMPLETED` are not wired.

## Next

Phase 2 in [`docs/SERVICES.md`](../../docs/SERVICES.md): Quality OS → capacity → wave dispatch → server ETA → proof chain → safe batch → incidents → cash hygiene (€500 cap, failed-cash HTTP).

## Development

From the monorepo root:

```sh
cp apps/api/.env.example apps/api/.env
npm run seed --workspace=api
npm run dev:api
```

```sh
npm run lint --workspace=api
npm run check-types --workspace=api
npm run test --workspace=api
```
