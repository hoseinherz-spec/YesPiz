# Yespizz demo runbook

Local click-through guide for the multi-app operations demo. Product context:
[`PRODUCT.md`](PRODUCT.md) · service catalogue: [`SERVICES.md`](SERVICES.md).

## Prerequisites

1. MongoDB and Redis (optional — API falls back to in-memory locks without Redis).
2. Copy `apps/api/.env.example` → `apps/api/.env` and set at least `JWT_SECRET`.
3. Install and build from repo root:

```sh
npm ci
```

## Seed demo data

From repo root:

```sh
npm run seed --workspace=api
```

Creates admin, provider kitchen near Munich, courier, customer, published pizza menu,
and a default customer address. The seed script prints demo logins and any created IDs.

### Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | `admin@yespizz.local` | `Admin123!` |
| Provider (Munich kitchen) | `provider.munich@yespizz.local` | `Provider123!` |
| Courier | `courier@yespizz.local` | `Courier123!` |
| Customer | `customer@yespizz.local` | `Customer123!` |

Override admin credentials with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before seeding.

## Start services

In separate terminals from repo root (API first):

```sh
npm run dev --workspace=api
npm run dev --workspace=mobile
npm run dev --workspace=provider-panel
npm run dev --workspace=courier-mobile
npm run dev --workspace=admin
```

### App URLs (dev ports)

| App | URL | Package |
|---|---|---|
| API | http://localhost:8058 | `apps/api` (`PORT`, default 8058) |
| Website | http://localhost:8050 | `apps/website` |
| Customer mobile | http://localhost:8051 | `apps/mobile` |
| Admin ops | http://localhost:8052 | `apps/admin` |
| Courier mobile | http://localhost:8053 | `apps/courier-mobile` |
| Provider panel | http://localhost:8084 | `apps/provider-panel` |

Set `NEXT_PUBLIC_API_URL=http://localhost:8058` in each frontend if not already configured.

## Click-through lifecycle

### 1. Customer places order (mobile — :8051)

1. Sign in as `customer@yespizz.local` / `Customer123!`.
2. Browse the published menu and add items to cart.
3. Checkout with the seeded Munich address.
4. Pay with card (mock capture when Stripe is unset) or cash if enabled.

Order enters dispatch → wave offers go to nearby kitchens.

### 2. Provider accepts & quality handoff (provider panel — :8084)

1. Sign in as `provider.munich@yespizz.local` / `Provider123!`.
2. Open incoming offers / kitchen queue and **accept** the order.
3. Move through prep statuses.
4. Complete **Quality OS** checklist, seal ID, and ready photo when prompted.
5. Mark **ready for pickup** (handoff gate enforced server-side).

### 3. Courier delivery & proof (courier mobile — :8053)

1. Sign in as `courier@yespizz.local` / `Courier123!`.
2. Accept batch / assignment when offered.
3. Run proof chain: pickup code → en route → deliver (PIN/photo) → cash receipt if applicable.
4. To demo incidents: report an incident from the active order (e.g. no answer, vehicle).

### 4. Admin operations (admin — :8052)

1. Sign in as `admin@yespizz.local` / `Admin123!`.
2. **Exceptions** — orders in `EXCEPTION_REPORTED` / `ADMIN_REVIEW`.
3. **Quality** — provider scores, record complaint/delay/error, unsuspend with reason, create test orders.
4. **Incidents** — open courier incident queue, resolve/cancel with notes and optional replacement courier ID.
5. **Providers / Menu / Config** — CRUD for kitchens, catalogue, and runtime config.

### 5. Verify blind marketplace

Customer order tracking must **not** show provider name, kitchen address, or courier identity.
Courier and provider apps see operational detail; customer mobile stays blind.

## Test order shortcut (admin Quality detail)

On **Quality → provider detail**, use **Test order** after seed:

- **Customer ID** — Mongo `_id` of `customer@yespizz.local` (printed at seed or query `users`).
- **Address ID** — default address created for that customer during seed.
- Select a menu item from the published catalogue; order skips payment and lands in the kitchen as `ACCEPTED_BY_PROVIDER`.

## Troubleshooting

| Symptom | Check |
|---|---|
| Login 401 | API running on :8058; seed completed; correct role app |
| No menu | Re-run seed; confirm published menu in admin **Menu** |
| Offers not appearing | Provider `acceptingOrders` and within dispatch radius |
| Handoff blocked | Checklist + seal/photo requirements on menu items |
| OTP in dev | `OTP_DEV_BYPASS` accepts `000000` locally only |

## What this demo does not cover

- Production Stripe webhooks, FCM push delivery, masked call/chat
- Cash Trust ladder, live ops map dashboard (ADMIN-003)
- Full SLA auto-compensation

See [`IMPLEMENTATION-BACKLOG.md`](IMPLEMENTATION-BACKLOG.md) for remaining P0/P1 work.
