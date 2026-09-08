# Yespizz — Service Catalogue & Rollout

Product: [`docs/PRODUCT.md`](PRODUCT.md) · strategy: [`prd/product-strategy.md`](../prd/product-strategy.md).

Execution-ready tasks: [`IMPLEMENTATION-BACKLOG.md`](IMPLEMENTATION-BACKLOG.md).
Local click-through: [`DEMO.md`](DEMO.md) · platform runbooks: [`PLATFORM.md`](PLATFORM.md).

**Local demo runbook:** [`DEMO.md`](DEMO.md) (seed, logins, ports, click-through lifecycle).

P0 is quality, wave dispatch, ETA, proof chain, safe batching, and incident workflows.
P1 is Cash Trust, ops dashboards, auto compensation, and retention.
Loyalty, ads, and predictive ML beyond history-based ETA are after MVP.

## Ordering services (`apps/api`)

Current implementation and launch acceptance gates: [Release readiness](RELEASE-READINESS.md). Historical phase tables below describe the wider roadmap, not live-service certification.

Happy path E2E reaches **completed delivery** with proof chain when Phase 2 flows are exercised.
See `apps/api/test/full-lifecycle.e2e-spec.ts`.

| Module | Endpoints (prefix `/api/v1`) |
|---|---|
| catalog | Admin CRUD menu versions/categories/items; client published menu |
| providers | Admin CRUD providers; provider self profile/members; `acceptingOrders` |
| orders | Addresses + create/list/get; kitchen status; admin review resolve; courier-location (blind) |
| dispatch | Start dispatch, provider list/accept/reject; 90s offer expiry cron (expand once → cancel) |
| payments | Initiate (mock or Stripe PaymentIntent); `POST /payments/webhook/stripe`; cash-availability |
| couriers | Profile, admin-issued single-use shift QR/OTP, current shift, `POST /couriers/me/location` |
| batches | Create/suggest batch, reduce by provider, assign courier |
| app-config | Admin get/update runtime config |
| realtime | Socket.IO namespace `/realtime` — rooms `order:`, `provider:`, `courier:`, `user:` |
| push | FCM HTTP v1, authenticated device binding, durable retry queue and failure review |

### Stripe

- Without `STRIPE_SECRET_KEY`: development/test mock capture; production rejects mock card payments.
- With key: create PaymentIntent (`AUTHORIZED`), return `clientSecret`; webhook `payment_intent.succeeded` captures and starts dispatch if the order is still `PENDING_PAYMENT`.
- Webhook verifies `STRIPE_WEBHOOK_SECRET` against raw body when set; otherwise accepts JSON event type (test mode). Nest boot uses `{ rawBody: true }`.

### Offer timeout (90s) — Phase 1 only

- Offers get `expiresAt` from `app_config.offerTimeoutSeconds` (default 90).
- `@nestjs/schedule` cron every 10s expires pending offers, then expands radius once, then cancels. Uses the same Redis accept lock as first-accept-wins.
- Target wave window is 10–20 seconds with a server-chosen winner. Do not extend the 90s race as the product model.

### Socket.IO

- Gateway namespace `/realtime`. Clients `emit('join', { orderId | providerId | courierId | userId })`.
- JWT in handshake `auth.token`; room joins are authorized against the current user. Raw `order:` rooms are admin-only; customer updates use the blind `user:` feed.
- Emits: `order.status`, `offer.created`, `offer.expired`, `courier.location`.
- Mobile tracking keeps **HTTP poll as primary**; `@repo/api` exports `realtimeUrl` / room helpers.

### Push

- FCM HTTP v1 uses `FCM_PROJECT_ID` and service-account/ADC authentication.
- Hooks: offers → provider, order status → customer, batch assignment → courier.
- Web/Capacitor opt-in binds tokens to the authenticated user. MongoDB stores retry state; invalid tokens are removed and device bindings expire with the login token.
- Actual notification delivery still needs project configuration and device acceptance.

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

- Dispatch ranking still uses open-order count more than prep-weight workload.
- Scheduled orders remain deferred. Leave-at-door and entrance details are persisted on checkout.

### Phase 2 progress (partial)

| Work | Status |
|---|---|
| Kitchen Quality OS | **API shipped.** Provider panel: checklist/seal/ready-photo. **Admin:** quality list/detail, penalties, unsuspend, test orders (`/quality`) |
| Cash hygiene | API shipped: €500 hard cap (`cashHardCapCents`), `POST /orders/:id/failed-cash`, admin cash restore, threshold from app config |
| Capacity + inventory | **Shipped:** `acceptCap` enforced; 86 items; pause/resume; prep override; `openOrders` decremented on complete/cancel/failed-cash |
| Wave dispatch | **Shipped:** bid window (`waveSize`/`bidWindowSeconds`); ready + quoted prep; server pick; expand N + radius |
| Server ETA | **Shipped:** prep + delivery window on order; customer view exposes ranges |
| Proof chain | **Shipped:** `DeliveryProof`; pickup → en-route → deliver → cash receipt → complete. Courier mobile proof flow wired |
| Safe batch | **Shipped:** proximity/ready-time suggest; safety checks; auto-split; `hasShortExtraStop` |
| Incident workflows | **Shipped:** typed courier incidents + workflow steps; admin resolve/reassign (`/incidents`) |

## Phase 2 — P0 operations (next)

API for rows 1–8 below is largely done; remaining UI is mostly customer/courier polish and ADMIN-003 dashboard.

| # | Work | Done when |
|---|---|---|
| 1 | Kitchen Quality OS | **API done.** Provider checklist shipped. **Admin minimum done** (score/evidence/unsuspend/test order). Audit trail UI still thin |
| 2 | Capacity + inventory | **API done.** Kitchen UI for 86/pause/cap |
| 3 | Wave dispatch | **API done.** Provider uses `POST /dispatch/orders/:id/respond` |
| 4 | Server ETA window | **API done.** Mobile should render range |
| 5 | Proof chain | **API done.** Courier app proof screens wired |
| 6 | Safe batch engine | **API done.** Provider/courier UI still thin |
| 7 | Incident workflows | **API done.** Courier report + **admin command center minimum done** |
| 8 | Cash hygiene | **Done (API):** €500 hard cap; failed-cash HTTP; admin restore. Full Cash Trust score is P1 |

## Phase 3 — P1 trust and repeat

| Work | Done when |
|---|---|
| Cash Trust Score + ladder | Verify → cap → prepay → online-only → ban → restore |
| Ops dashboard | Live map, at-risk orders, reassign, formula sandbox, accept/reject, on-time, errors, profit, fraud |
| Auto compensate | SLA miss → credit/discount without support |
| Customer reliability | Delay push, in-app map, masked call/chat, entrance details, one-tap reorder, scheduled order |

## Phase 4 — after MVP

Group order, split pay, loyalty / free-delivery subscription, ads, ML ETA beyond history.

The release-readiness runbook distinguishes implemented payment, push, storage and communication adapters from acceptance tests that require external accounts.

## Environment

See `apps/api/.env.example`. Key vars:

| Var | Purpose |
|---|---|
| `REDIS_URL` | Required in production; development can use in-memory locks |
| `OTP_DEV_BYPASS` | Local/dev — accepts OTP `000000` |
| `STRIPE_SECRET_KEY` | When set, real Stripe PaymentIntent; otherwise mock |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js (not read by API) |
| `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_JSON` | FCM HTTP v1 project and credentials (ADC is also supported) |
| `NEXT_PUBLIC_API_URL` | Frontend clients (default `http://localhost:8058`) |

## Seed

```sh
npm run seed --workspace=api
```

Creates admin user, published pizza menu, and a demo Munich-area provider.
Demo logins and click-through steps: [`DEMO.md`](DEMO.md).
