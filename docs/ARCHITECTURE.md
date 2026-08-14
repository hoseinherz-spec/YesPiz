# Yespizz — System Architecture

## 1. Overview

Yespizz is a blind-marketplace pizza delivery platform: customers order from a
fixed, admin-owned menu; the system dispatches orders to nearby partner
kitchens ("providers") whose identity is never revealed to the customer.
Providers' own couriers deliver, optionally batching up to 3 nearby orders.

| Workspace | Role | Stack |
|---|---|---|
| `apps/api` | Backend, single source of truth | NestJS + Mongoose + Redis |
| `apps/mobile` | Customer app | Next.js (static) + Capacitor + Hero UI |
| `apps/courier-mobile` | Courier app | Next.js (static) + Capacitor |
| `apps/provider-panel` | Provider (kitchen) panel | Next.js |
| `apps/admin` | Admin panel | Next.js |
| `apps/website` | Marketing site | Next.js |
| `packages/*` | ui, i18n, theme, icons, api client | shared |

## 2. Core invariants (enforced in backend only)

1. **Blind identity** — no customer-facing API/DTO may contain provider name, address, coordinates, logo, or id.
2. **First-accept-wins** — offers broadcast to top-N providers; first atomic claim (Redis lock + Mongo update) wins.
3. **Batch ≤ 3** — courier batches hold at most 3 orders; providers may remove, never add.
4. **Cash ban** — failed cash payments disable CASH until admin override.
5. **Versioned menu** — orders reference an immutable `menuVersion`.
6. **Never trust the client** — pricing, ranking, and state transitions are server-side.

## 3. API module map (`apps/api/src/`)

| Module | Responsibility |
|---|---|
| `account` | Auth (OTP/SSO/JWT), profile |
| `catalog` | Menu versions, categories, items, prep weights |
| `providers` | Partner kitchens, radius, rating, members |
| `orders` | Addresses, order creation, status machine |
| `dispatch` | Ranking, broadcast offers, first-accept claim |
| `payments` | Payment methods + cash-ban |
| `couriers` | Profiles, QR/OTP sessions |
| `batches` | Batch ≤3, route order |
| `redis` | Locks, session TTL (in-memory fallback when no Redis) |
| `app-config` | Algorithm weights, timeouts, cash threshold |

## 4. Order status machine

```
DRAFT → PENDING_PAYMENT → PENDING_OFFERS → ACCEPTED_BY_PROVIDER →
PREPARING → READY_FOR_PICKUP → ASSIGNED_TO_COURIER → PICKED_UP →
ON_THE_WAY → DELIVERED → COMPLETED
```

Side states: `EXCEPTION_REPORTED`, `ADMIN_REVIEW`, `CANCELLED`, `FAILED_CASH`.

Customer projection (matches mobile `ORDER_STEPS`):
`received → kitchen → preparing → driver → onway → delivered`.

## 5. Dispatch algorithm

```
score = w1·internalRating + w2·proximity + w3·queueEmptiness
```

- Workload = Σ(item prepWeight × qty) of active kitchen orders.
- Broadcast to top-N (default 8) providers in radius ready for the menu version.
- Offer timeout: 90s. First accept wins.
- If none accept: expand radius once, then auto-cancel.

## 6. Infrastructure

- **MongoDB** — domain data + 2dsphere geo indexes
- **Redis** — offer locks, courier sessions (optional in-memory fallback for local)
- **Twilio Verify / Google SSO** — already in `account`

## 7. Local ports

| Service | Port |
|---|---|
| Website | 8050 |
| Mobile | 8051 |
| Admin | 8052 |
| Courier | 8053 |
| Provider | 8084 |
| API | 8058 |
