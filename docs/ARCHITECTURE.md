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
| `account` | Auth (OTP/SSO/JWT), profile, flat `cashBanned` |
| `catalog` | Menu versions, categories, items, prep weights |
| `providers` | Partner kitchens, radius, admin rating, members, `acceptingOrders` |
| `orders` | Addresses, order creation, kitchen status machine |
| `dispatch` | Rank, broadcast offers, first-accept claim, one radius expand |
| `payments` | Card (Stripe or mock) + cash; cash-availability |
| `couriers` | Profiles, stub QR/OTP sessions, live location |
| `batches` | Batch ≤3, suggest/create/reduce, assign courier |
| `redis` | Locks, session TTL (in-memory fallback when no Redis) |
| `app-config` | Algorithm weights, timeouts, cash fail threshold, max batch |
| `realtime` | Socket.IO `/realtime` |
| `push` | Dev/stub FCM |

### Target (P0 / P1 — not shipped)

| Module (planned) | Responsibility |
|---|---|
| Quality OS | Recipes, cook/temp standards, numbered seals, pre-handoff checklist, ready photo, internal score, auto-suspend, admin test orders |
| Capacity | Per-kitchen accept cap, per-order prep override, item 86, pause new orders |
| ETA | Server prep + delivery window from history, time of day, pizza type, queue |
| Wave dispatch | Top-3 bid window (10–20s), server pick, fairness weight, expand N + radius |
| Proof chain | Seal id, pickup QR/OTP + geo, PIN/sign/photo at door, cash receipt, custody log |
| Incidents | Crash, no-answer, no-pay, wrong address, damaged pack, vehicle, SOS — each a workflow |
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

**Shipped transitions** end at `ASSIGNED_TO_COURIER` (plus exception/admin/cancel/failed-cash).
`PICKED_UP` → `COMPLETED` are defined but not reachable until the proof chain exists.

Customer projection (mobile `ORDER_STEPS`):
`received → kitchen → preparing → driver → onway → delivered`.

Exception and admin-review stay on `kitchen` so the customer never sees kitchen-failure wording.

## 5. Dispatch

### Phase 1 (shipped): first-accept-wins

```
score = w1·(rating/5) + w2·(1 − dist/maxDist) + w3·(1 − openOrders/maxQueue)
```

Defaults (`app_config`): `w1=0.4`, `w2=0.4`, `w3=0.2`, `dispatchTopN=5`,
initial radius 3000 m, expanded 6000 m, offer timeout 90s.

- Broadcast to top-N providers in radius with `acceptingOrders`.
- First atomic claim (Redis lock + Mongo update) wins.
- If none accept: expand radius once, then auto-cancel.
- Workload today is an `openOrders` counter (incremented on accept). Target: real queue + prep-weight + quoted ETA.

This model rewards click speed. It is an interim skeleton, not the product.

### Target (P0): wave allocation

1. Offer to the top 3 kitchens (not 5+ racing).
2. Each has 10–20 seconds to declare readiness and a prep time.
3. Server scores respondents and assigns one winner.
4. If nobody responds, expand radius and N.

Target score inputs: distance, quoted prep, queue capacity, delay rate, error
rate, quality score, recent volume, accept probability, fairness weight.

Providers never select the winner. Admin can simulate weight changes before applying them.

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
