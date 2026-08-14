# Yespizz — Data Models

Primary store: MongoDB via Mongoose (`apps/api`).

Product context: [`docs/PRODUCT.md`](PRODUCT.md). Status machine: [`ARCHITECTURE.md`](ARCHITECTURE.md).

`Shipped` = fields/collections in code today. `Target` = required for the product promise.

## User (`account`)

**Shipped**

- Roles: `customer` (API/client alias `client`), `admin`, `provider`, `courier`
- Auth: password hash, phone OTP, optional Google subject
- Profile: display name, email, phone, locale
- `cashBanned: boolean` + `failedCashCount`

**Target**

- Cash Trust Score and ladder state (verify / cap / prepay / online-only / banned)
- Open cash debt, no-answer count, cancel count, account age
- Device / phone / address match signals
- Admin restore reason + timestamp (the old nested `cashBan` shape)

## Address

**Shipped**

- Owned by customer user id
- Label, line1/line2, city, postal code, country
- Geo point `[lng, lat]` for dispatch proximity

**Target**

- Building entrance, floor, door code
- Optional entrance / drop-off photo
- Hand-to-customer vs leave-at-door (online pay only)

## MenuVersion / Category / Item (`catalog`)

**Shipped**

- Admin-owned immutable menu versions; one `published` at a time
- Items: name, description, `priceCents`, extras/tags, `prepWeight`, image URL, `isActive`
- Orders snapshot `menuVersion` id at create time

**Target (Quality OS)**

- Standard recipe and ingredient weights per item
- Cook time and handoff temperature
- Packaging + numbered-seal requirement

## Provider

**Shipped**

- Kitchen identity (never exposed to customers)
- Location geo, service radius, admin-set internal rating (default 4.5)
- Members (user ids with provider role)
- `acceptingOrders`, `isActive`

**Target**

- Accept capacity (max open orders)
- Per-item 86 / unavailable from the kitchen
- Quality score from complaints, delays, errors (not only admin edit)
- Auto-suspend when quality drops below threshold
- Delay rate, error rate, accept probability, recent volume (dispatch inputs)
- Fairness / anti-monopoly weight

## Order

**Shipped**

- Customer id, address snapshot, line items with server prices
- Status machine (see ARCHITECTURE.md) — public path stops at `ASSIGNED_TO_COURIER`
- `providerId` internal only
- `customerStep` projection for mobile tracking
- Payment method / payment refs
- Exception / admin review fields
- `notes`

**Target**

- Server ETA window (prep + delivery), not a client guess
- Quoted prep time from the winning kitchen
- SLA deadline + auto-compensation record
- Seal id, ready photo, pre-handoff checklist result
- Proof refs (pickup, drop-off, cash receipt)
- Customer-visible “courier has one short stop” flag (no other-order leak)
- Scheduled-for timestamp (checkout chips are UI-only today)

## Payment

**Shipped**

- Order id, method (`card` | `cash` | `wallet` enum), status
- `providerRef` — Stripe id or `mock_*` in local mode
- Cash initiate is blocked when `user.cashBanned`

**Target**

- No cash when order total > €500
- Cash Trust gate before offer of CASH
- Digital cash-received receipt
- Working `FAILED_CASH` path from courier / admin (service exists, no HTTP)

## DispatchOffer

**Shipped**

- Order id, provider id, score, status (`pending` | `accepted` | `rejected` | `expired`)
- `expiresAt` (default 90s), first Accept wins

**Target (wave)**

- Bid window 10–20s
- Provider response: ready yes/no + quoted prep minutes
- Server-chosen winner among respondents
- Score breakdown stored for admin sandbox

## Courier / Session

**Shipped**

- Courier profile tied to provider
- Session start accepts any non-empty code (stub); end uses 6-digit `endCode`
- Live location while session active

**Target**

- Validated kitchen QR / OTP at pickup
- Custody: which courier holds which sealed package
- Incident records (see below)

## Batch

**Shipped**

- Up to `maxBatchSize` (default 3) order ids, assigned courier
- Provider may reduce membership, never expand
- `totalPrepWeight`; statuses exist (`open` … `cancelled`) but later ones are unused
- Suggest is FIFO ready orders, not geo/time-safe

**Target**

- Ready-time alignment, route deviation, max bag time (~8 min), vehicle cap
- Cash vs online mix, customer priority, building-delay risk
- Auto-split when one order slips
- Route order
- Customer informed of a short extra stop only

## AppConfig

**Shipped**

- `w1Rating`, `w2Proximity`, `w3QueueEmptiness`
- `dispatchTopN` (5), radii 3000 / 6000, `offerTimeoutSeconds` (90)
- `cashFailThreshold` (1), `maxBatchSize` (3)

**Target**

- Wave size, bid window seconds, fairness weight
- Max batch hold minutes, max bag minutes
- SLA minutes + compensation amounts
- Cash Trust thresholds and €500 hard cap
- Quality auto-suspend threshold

## Target collections (not in code)

| Collection | Purpose |
|---|---|
| `QualityChecklist` / `ReadyPhoto` | Pre-handoff kitchen proof |
| `DeliveryProof` | Seal, pickup QR/OTP+geo, drop-off PIN/sign/photo, cash receipt |
| `Incident` | Typed courier event + workflow state + replacement courier |
| `CashTrust` | Score, signals, ladder, debt |
| `Compensation` | SLA miss → credit/discount, no support ticket required |
| `ProviderMetrics` | Accept/reject, wait, on-time, error, complaint, profit |
