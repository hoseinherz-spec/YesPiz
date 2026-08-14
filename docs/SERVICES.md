# Yespizz — Service Catalogue & Rollout

## Implemented in `apps/api`

| Module | Endpoints (prefix `/api/v1`) |
|---|---|
| catalog | Admin CRUD menu versions/categories/items; client published menu |
| providers | Admin CRUD providers; provider self profile/members |
| orders | Addresses + create/list/get; kitchen status; admin review resolve; courier-location (blind) |
| dispatch | Start dispatch, provider list/accept/reject; 90s offer expiry cron (expand once → cancel) |
| payments | Initiate (mock or Stripe PaymentIntent); `POST /payments/webhook/stripe` |
| couriers | Profile, QR·OTP session, `POST /couriers/me/location` |
| batches | Create/suggest batch, reduce by provider, assign courier |
| app-config | Admin get/update runtime config |
| realtime | Socket.IO namespace `/realtime` — rooms `order:`, `provider:`, `courier:`, `user:` |
| push | Dev/stub FCM — offer + status hooks; persists last notifications |

## Phase 4 — production hardening

### Stripe
- Without `STRIPE_SECRET_KEY`: mock capture + immediate dispatch (Phase 1 behavior).
- With key: create PaymentIntent (`AUTHORIZED`), return `clientSecret`; webhook `payment_intent.succeeded` captures and starts dispatch if order is still `PENDING_PAYMENT`.
- Webhook verifies `STRIPE_WEBHOOK_SECRET` against raw body when set; otherwise accepts JSON event type (test mode). Nest boot uses `{ rawBody: true }`.

### Offer timeout (90s)
- Offers get `expiresAt` from `app_config.offerTimeoutSeconds` (default 90).
- `@nestjs/schedule` cron every 10s expires pending offers, then expands radius once, then cancels. Uses the same Redis accept lock as first-accept-wins.

### Socket.IO
- Gateway namespace `/realtime`. Clients `emit('join', { orderId | providerId | courierId | userId })`.
- Optional JWT in handshake `auth.token`.
- Emits: `order.status`, `offer.created`, `offer.expired`, `courier.location`.
- Mobile tracking keeps **HTTP poll as primary**; `@repo/api` exports `realtimeUrl` / room helpers for optional clients.

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
