# Yespizz — Service Catalogue & Rollout

Product: [`docs/PRODUCT.md`](PRODUCT.md) · strategy: [`prd/product-strategy.md`](../prd/product-strategy.md).

P0 is quality, wave dispatch, ETA, proof chain, safe batching, and incident workflows.
P1 is Cash Trust, ops dashboards, auto compensation, and retention.
Loyalty, ads, and predictive ML beyond history-based ETA are after MVP.

## Phase 1 — shipped skeleton (`apps/api`)

Happy path today ends at **courier assigned + blind location poll**.
See `apps/api/test/full-lifecycle.e2e-spec.ts`.

| Module | Endpoints (prefix `/api/v1`) |
|---|---|
| catalog | Admin CRUD menu versions/categories/items; client published menu |
| providers | Admin CRUD providers; provider self profile/members; `acceptingOrders` |
| orders | Addresses + create/list/get; kitchen status; admin review resolve; courier-location (blind) |
| dispatch | Start dispatch, provider list/accept/reject; 90s offer expiry cron (expand once → cancel) |
| payments | Initiate (mock or Stripe PaymentIntent); `POST /payments/webhook/stripe`; cash-availability |
| couriers | Profile, stub QR·OTP session, `POST /couriers/me/location` |
| batches | Create/suggest batch, reduce by provider, assign courier |
| app-config | Admin get/update runtime config |
| realtime | Socket.IO namespace `/realtime` — rooms `order:`, `provider:`, `courier:`, `user:` |
| push | Dev/stub FCM — offer + status hooks; persists last notifications |

### Stripe

- Without `STRIPE_SECRET_KEY`: mock capture + immediate dispatch.
- With key: create PaymentIntent (`AUTHORIZED`), return `clientSecret`; webhook `payment_intent.succeeded` captures and starts dispatch if the order is still `PENDING_PAYMENT`.
- Webhook verifies `STRIPE_WEBHOOK_SECRET` against raw body when set; otherwise accepts JSON event type (test mode). Nest boot uses `{ rawBody: true }`.

### Offer timeout (90s) — Phase 1 only

- Offers get `expiresAt` from `app_config.offerTimeoutSeconds` (default 90).
- `@nestjs/schedule` cron every 10s expires pending offers, then expands radius once, then cancels. Uses the same Redis accept lock as first-accept-wins.
- Target wave window is 10–20 seconds with a server-chosen winner. Do not extend the 90s race as the product model.

### Socket.IO

- Gateway namespace `/realtime`. Clients `emit('join', { orderId | providerId | courierId | userId })`.
- Optional JWT in handshake `auth.token`.
- Emits: `order.status`, `offer.created`, `offer.expired`, `courier.location`.
- Mobile tracking keeps **HTTP poll as primary**; `@repo/api` exports `realtimeUrl` / room helpers.

### Push

- `PushService` logs payloads, stores in Mongo + in-memory ring buffer.
- Hooks: offer created → provider; order status change → customer.
- `FCM_SERVER_KEY` enables stub FCM path (device-token wiring deferred to Capacitor).

### Live courier location

- Courier posts `{ longitude, latitude }` while session active.
- Customer `GET /orders/:id/courier-location` returns only coords + `updatedAt` (no kitchen/provider leak).

### Exceptions + admin review

- Kitchen can set `EXCEPTION_REPORTED`.
- Admin `PATCH /orders/admin/review/:id` → `ADMIN_REVIEW` | `PREPARING` | `CANCELLED`.
- Customer blind view maps exception/admin-review → `customerStatus: "kitchen"`.

### Apple Sign-In

- Still hidden on mobile login — not implemented.

### Known Phase 1 gaps (do not document as done)

- `openOrders` increments on accept and is never decremented.
- Dispatch uses order count, not prep-weight workload.
- `markFailedCash` has no HTTP endpoint and ignores `cashFailThreshold`.
- No admin unban / Cash Trust.
- No €500 cash cap.
- `PICKED_UP` → `COMPLETED` are not reachable.
- Provider panel cannot assign a courier (API exists).
- Checkout schedule chips and leave-at-door are not sent to the API.

## Phase 2 — P0 operations (next)

Build in this order. Each row must land in API first; UI follows.

| Order | Work | Done when |
|---|---|---|
| 1 | Kitchen Quality OS | Recipe/weight/temp/seal/checklist/photo; internal score; auto-suspend; admin test order |
| 2 | Capacity + inventory | Kitchen sets cap, prep override, 86 item, pause new orders, mark ready (ready already exists) |
| 3 | Wave dispatch | Top-3 bid 10–20s; server picks; fairness; expand N + radius. Retire first-accept-wins |
| 4 | Server ETA window | History + time of day + pizza type + queue; mobile shows a range |
| 5 | Proof chain | Seal, pickup QR/OTP+geo, door PIN/sign/photo, cash receipt, custody. Wire `PICKED_UP` → `COMPLETED` |
| 6 | Safe batch engine | Ready-time, route deviation, max bag time, auto-split; customer sees “one short stop” only |
| 7 | Incident workflows | Crash, no-answer, no-pay, wrong address, damaged, vehicle, SOS — each starts a workflow |
| 8 | Cash hygiene | €500 hard cap; failed-cash HTTP; admin restore. Full Cash Trust score is P1 |

## Phase 3 — P1 trust and repeat

| Work | Done when |
|---|---|
| Cash Trust Score + ladder | Verify → cap → prepay → online-only → ban → restore |
| Ops dashboard | Live map, at-risk orders, reassign, formula sandbox, accept/reject, on-time, errors, profit, fraud |
| Auto compensate | SLA miss → credit/discount without support |
| Customer reliability | Delay push, in-app map, masked call/chat, entrance details, one-tap reorder, scheduled order |

## Phase 4 — after MVP

Group order, split pay, loyalty / free-delivery subscription, ads, ML ETA beyond history.

Production hardening that is already started (Stripe webhook, Socket.IO, push stub) stays in Phase 1 and should be finished in parallel with Phase 2 — it is not a substitute for Quality OS or wave dispatch.

## Environment

See `apps/api/.env.example`. Key vars:

| Var | Purpose |
|---|---|
| `REDIS_URL` | Optional. Without it, in-memory lock store is used |
| `OTP_DEV_BYPASS` | Local/dev — accepts OTP `000000` |
| `STRIPE_SECRET_KEY` | When set, real Stripe PaymentIntent; otherwise mock |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js (not read by API) |
| `FCM_SERVER_KEY` | Optional FCM stub |
| `NEXT_PUBLIC_API_URL` | Frontend clients (default `http://localhost:8058`) |

## Seed

```sh
npm run seed --workspace=api
```

Creates admin user, published pizza menu, and a demo Munich-area provider.
