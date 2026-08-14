# Yespizz — Customer app

Workspace: `apps/mobile` · http://localhost:8051

The customer never chooses a restaurant and never sees a kitchen. This app is the brand: a fixed menu, an honest time window, blind tracking, proof of delivery, and automatic make-good when we miss.

Product: [`docs/PRODUCT.md`](../../docs/PRODUCT.md) · strategy: [`prd/product-strategy.md`](../../prd/product-strategy.md).

## Role

- Order from the admin-owned menu only.
- Show a **time range**, not a fake single minute.
- Track the courier without leaking kitchen identity.
- Collect drop-off details (entrance, floor, door code, photo) and proof (PIN / photo).
- Offer cash only when Cash Trust allows it. Never cash above €500.

## Shipped

| Route | What it does |
|---|---|
| `/onboarding`, `/login` | Local onboarding; OTP + password. No Apple Sign-In |
| `/home`, `/menu`, `/pizza/[id]` | Published menu + offline fallback |
| `/cart`, `/checkout`, `/payment` | Create order + pay when authenticated |
| `/tracking` | Poll status + courier coords (OSM link, no in-app map) |
| `/orders` | History. Reorder only navigates to `/menu` |
| `/profile`, `/settings` | Theme, language, prefs |
| `/notifications`, `/help` | Stub / static |
| `/partner` | Info |

ETA on tracking is a client formula, not a server window. Schedule chips and leave-at-door are not sent to the API. Cash availability is not checked before showing cash.

## Next (P0 / P1)

- Server ETA window + active delay notices
- In-app courier map; masked call / chat
- Entrance, floor, door code, drop-off photo
- Door PIN / photo proof
- One-tap reorder and real scheduled orders
- Auto compensation when SLA is missed
- Cash Trust gating in checkout

Loyalty, group order, and split pay are after MVP.

## Development

From the monorepo root:

```sh
npm run dev:mobile
```

Capacitor static export. API: `NEXT_PUBLIC_API_URL` (default `http://localhost:8058`).

```sh
npm run lint --workspace=mobile
npm run check-types --workspace=mobile
npm run build --workspace=mobile
```
