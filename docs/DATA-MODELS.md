# Yespizz — Data Models

Primary store: MongoDB via Mongoose (`apps/api`).

## User (`account`)

- Roles: `customer` (API/client alias `client`), `admin`, `provider`, `courier`
- Auth: password hash, phone OTP, optional Google subject
- Profile: display name, email, phone, locale
- `cashBan.active` + reason/timestamp when cash is disabled

## Address

- Owned by customer user id
- Label, line1/line2, city, postal code, country
- Geo point `[lng, lat]` for dispatch proximity

## MenuVersion / Category / Item (`catalog`)

- Admin-owned immutable menu versions
- Only one version `published` at a time
- Items: name, description, prices by size, extras, prepWeight, image URL, active flag
- Orders snapshot `menuVersion` id at create time

## Provider

- Kitchen identity (never exposed to customers)
- Location geo, service radius, internal rating
- Members (user ids with provider role)
- Ready flags / supported menu versions

## Order

- Customer id, address snapshot, line items with server prices
- Status machine (see ARCHITECTURE.md)
- `providerId` internal only
- `customerStep` projection for mobile tracking
- Payment method / payment refs
- Exception / admin review fields

## Payment

- Order id, method (`card` | `cash` | …), status (`pending` | `captured` | `failed`)
- `providerRef` — Stripe id or `mock_*` in local mode

## DispatchOffer

- Order id, provider id, score, status (`pending` | `accepted` | `rejected` | `expired`)
- Expires at (90s window)

## Courier / Session

- Courier profile tied to provider
- Active session via QR/OTP code + Redis/Mongo TTL

## Batch

- Up to 3 order ids, assigned courier, route order
- Provider may reduce membership, never expand beyond rules

## AppConfig

- Dispatch weights, top-N, radii, offer timeout seconds
- Cash ban enabled + override threshold
