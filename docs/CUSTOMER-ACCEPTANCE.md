# Customer app completion — 2026-09-14

Source: `/Users/mahdi/Documents/projects/Yespiz`.
Preview: http://localhost:8151/home/ (production export, disposable API on 8158, Stripe sandbox).

## Implemented

- Home, product choice, cart, checkout and auth handoff refinements from the earlier implementation remain in place.
- Cart checks the published menu, marks obsolete/unavailable lines, blocks checkout and offers explicit removal and replacement. A failed catalog request offers retry. The quantity control now fits small cards instead of overflowing beside the product image.
- Payment can retry failed quotation and return directly to cart or delivery details. Unverified zero-value summary rows are hidden. Network failures have an actionable explanation. A saved pending order can check payment status without creating another order.
- Payment re-quotes before creation. The API accepts an optional reviewed `expectedTotalCents` and rejects a mismatch before persisting an order. Accepted retries remain idempotent. Old clients retain compatibility.
- Server errors explain stale menu, unavailable pizza, service area and invalid start-time cases.
- Tracking associates courier coordinates with the correct order, removes coordinates on failed polling, expires them after 90 seconds, and shows connection loss while retrying. No-location layout is compact and theme-aware. A hardcoded courier name was removed; contact actions wait for assignment. Expired ETA windows no longer claim arrival in zero minutes.
- Light-mode standalone lime text and the preparation badge use a readable foreground. Brand button fills remain lime.

## Automated verification

| Check | Result |
| --- | --- |
| API unit tests | 19 suites, 109 tests passed |
| Shared form tests | 6 passed |
| API integration tests | 5 suites, 31 tests passed |
| Real Stripe test API and signed sandbox webhook tests | 3 passed |
| Customer regression assertions | Passed: redirect safety, checkout draft, scheduling persistence, ETA expiry |
| Mobile lint | Passed |
| Mobile production build | Passed, 34 static routes |
| API production build | Passed |
| Git whitespace check | Passed |

The new integration scenarios verify that a changed reviewed total creates no order, an accepted retry creates only one, and stale menus, missing products, expired schedules and outside-area addresses are rejected. The existing integration suites cover multi-role lifecycle, courier proof, cancellation, compensation/refunds and reorder behavior.

## Observed browser flows

- Seeded customer sign-in → live catalog → large pizza plus extra cheese → server quote €16.48 → Stripe declined-card message → retry same order with successful test card → confirmation → tracking.
- Unaccepted test order transitioned to cancelled, with refund sent to original payment method shown in history.
- Reorder restored size, extras and current server price through a review dialog.
- Current build: €11.98 order → real Stripe sandbox 3DS challenge → Complete → successful order confirmation → manual cancellation with reason → refund shown in history.
- Temporarily deactivated a pizza in the disposable API. Cart showed an explicit unavailable notice, blocked checkout, and the remove-unavailable action returned to the empty state. Product availability was restored afterwards.
- Disconnected API produced quote recovery actions; final copy and summary presentation were improved from this observation.
- Light and dark surfaces inspected; 12 routes measured at 320 CSS pixels with no document-level horizontal overflow. Populated cart and checkout were also inspected. Measurements are in `layout-checks.json`.
- Keyboard Tab reached the delivery-address link with a visible outline. Keyboard activation removed a cart item.
- Local preview encountered ChunkLoadError after repeated rebuild/navigation; static assets remained healthy. Restarting the temporary static server with logs redirected to a file resolved loading. Subsequent orders, home and settings loaded successfully.

## Scope and remaining release checks

This is a completed local customer-app implementation and sandbox acceptance pass, not a live launch. No real charge, customer message, or deployment was made. The preview's database is disposable.

A 200% browser zoom attempt was not applied by the in-app browser controls, so it is **not verified**. The 320-pixel reflow checks and keyboard checks do not constitute a full assistive-technology audit. Native iOS/Android binaries and live push, SMS, OAuth provisioning, maps/geocoding credentials, production payment keys, operational kitchens/couriers and production deployment still require their environment-specific release verification. API tests use disposable MongoDB; external communications were disabled.

## Repeatable commands

Run from the source repository:

```sh
npm test
MONGOMS_SYSTEM_BINARY=/opt/homebrew/bin/mongod npm run test:e2e --workspace=api -- --runInBand --watchman=false
npm run test:customer-ux
npm run lint --workspace=mobile
npm run build --workspace=api
YESPIZZ_E2E_OUTPUT=1 NEXT_PUBLIC_API_URL=http://localhost:8158 npm run build --workspace=mobile -- --webpack
```

Stripe requires the existing local sandbox configuration and official Stripe CLI; secrets are not included in this report. With `YESPIZZ_E2E_OUTPUT=1`, Next exports to `apps/mobile/.next-e2e/`, not the older `out/` directory.

Screenshots: `home-light.png`, `home-dark.png`, `refund-light.png`, `cart-unavailable.png`. The unavailable-cart screenshot precedes the final badge contrast adjustment; the refund screenshot shows the final readable total.
