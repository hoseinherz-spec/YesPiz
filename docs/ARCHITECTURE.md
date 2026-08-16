# Yespizz — System Architecture

Product north star: [`docs/PRODUCT.md`](PRODUCT.md) · full strategy: [`prd/product-strategy.md`](../prd/product-strategy.md).

## 1. Overview

Yespizz is a blind-marketplace pizza delivery platform. Customers order from a
fixed, admin-owned menu. The system assigns orders to nearby partner kitchens
("providers") whose identity is never revealed to the customer. Partner
couriers deliver, optionally batching nearby orders when it will not cool the
pizza.

The product promise is not the menu. It is a **standard, reliable order at a
stated time**, without the customer choosing a restaurant.

| Workspace | Role | Stack |
|---|---|---|
| `apps/api` | Backend, single source of truth | NestJS + Mongoose + Redis |
| `apps/mobile` | Customer app | Next.js (static) + Capacitor + Hero UI |
| `apps/courier-mobile` | Courier app | Next.js (static) + Capacitor |
| `apps/provider-panel` | Provider (kitchen) panel | Next.js |
| `apps/admin` | Admin / ops panel | Next.js |
| `apps/website` | Marketing site | Next.js |
| `packages/*` | ui, i18n, theme, icons, api client | shared |

## 2. Core invariants (enforced in backend only)

1. **Blind identity** — no customer-facing API/DTO may contain provider name, address, coordinates, logo, or id.
2. **Server chooses the kitchen** — providers declare readiness; they do not win by clicking first. Phase 1 still uses first-accept-wins; target is wave allocation (see §5).
3. **Batch ≤ 3, quality first** — a batch holds at most 3 orders; providers may remove, never add. Do not batch if it would hold food more than the configured wait (target: ~8 minutes).
4. **Cash is earned trust** — failed cash and low Cash Trust restrict or block CASH. No cash above €500.
5. **Versioned menu** — orders reference an immutable `menuVersion`.
6. **Never trust the client** — pricing, ranking, compensation, and state transitions are server-side.

## 3. API module map (`apps/api/src/`)

### Shipped

| Module | Responsibility |
|---|---|
| `account` | Auth (OTP/SSO/JWT), profile, cash ban + admin restore |
| `catalog` | Menu versions, categories, items, prep weights, Quality OS recipe fields |
| `providers` | Partner kitchens, radius, admin rating, quality score, auto-suspend, members, `acceptingOrders` |
| `orders` | Addresses, order creation, kitchen status machine, failed-cash HTTP |
| `dispatch` | Rank, broadcast offers, first-accept claim, one radius expand |
| `payments` | Card (Stripe or mock) + cash; cash-availability with €500 hard cap |
| `quality` | Checklist/seal/ready-photo, score penalties, auto-suspend, admin test orders |
| `couriers` | Profiles, stub QR/OTP sessions, live location |
| `batches` | Batch ≤3, suggest/create/reduce, assign courier |
| `redis` | Locks, session TTL (in-memory fallback when no Redis) |
| `app-config` | Algorithm weights, wave/bid, ETA, batch hold, proof geo radii, cash/quality/batch knobs |
| `realtime` | Socket.IO `/realtime` |
| `push` | Dev/stub FCM |
| `eta` | Server prep + delivery ETA windows |
| `proof` | Pickup/drop-off/cash receipt custody; `PICKED_UP`→`COMPLETED` |
| `incidents` | Typed courier incident workflows |

### Target (remaining P1)

| Module (planned) | Responsibility |
|---|---|
| Cash Trust | Score + ladder (verify → cap → prepay → online-only → ban → admin restore) |
| Compensate | Auto credit/discount when SLA is missed |
| Ops | Live map, at-risk alerts, reassign, formula sandbox, fraud |

## 4. Order status machine

```
DRAFT → PENDING_PAYMENT → PENDING_OFFERS → ACCEPTED_BY_PROVIDER →
PREPARING → READY_FOR_PICKUP → ASSIGNED_TO_COURIER → PICKED_UP →
ON_THE_WAY → DELIVERED → COMPLETED
```

Side states: `EXCEPTION_REPORTED`, `ADMIN_REVIEW`, `CANCELLED`, `FAILED_CASH`.

**Shipped transitions** include courier proof chain through `COMPLETED` (plus exception/admin/cancel/failed-cash).
Pickup requires validated code + geo; delivery requires PIN/sign/photo; cash needs a digital receipt before complete.

Customer projection (mobile `ORDER_STEPS`):
`received → kitchen → preparing → driver → onway → delivered`.

Exception and admin-review stay on `kitchen` so the customer never sees kitchen-failure wording.

## 5. Dispatch

### Phase 1 (legacy): first-accept-wins

Previously broadcast top-N and first Accept claimed the order. Replaced by wave allocation.

### Shipped (P0): wave allocation

1. Offer the order to `waveSize` kitchens (default 3; expands with `waveExpandCount`).
2. Each has `bidWindowSeconds` (default 15) to declare ready + quoted prep via `POST /dispatch/orders/:id/respond`.
3. Server scores respondents (base rank + prep + quality + fairness) and assigns one winner.
4. If nobody is ready, expand N + radius (up to 2 expands), then cancel.

Providers never select the winner. Admin can force `POST /dispatch/orders/:id/resolve-wave`.

Legacy `POST .../accept` maps to ready=true with a default 20-minute prep quote and still waits for wave resolution.

## 6. Infrastructure

- **MongoDB** — domain data + 2dsphere geo indexes
- **Redis** — offer locks, courier sessions (optional in-memory fallback for local)
- **Twilio Verify / Google SSO** — already in `account`
- **Stripe** — PaymentIntent when `STRIPE_SECRET_KEY` is set; otherwise mock

## 7. Local ports

| Service | Port |
|---|---|
| Website | 8050 |
| Mobile | 8051 |
| Admin | 8052 |
| Courier | 8053 |
| Provider | 8084 |
| API | 8058 |
