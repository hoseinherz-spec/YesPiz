# Customer order tracking

`/tracking/?orderId=<id>` supports direct links. Without an ID, the selected order or first active order is used. Authentication and ownership are enforced by the API.

## Boundaries

- `useOrderTracking` owns the authenticated snapshot, Socket.IO subscription, request cancellation, reconnect handling, five-second polling fallback and GPS freshness. Events carry only an order ID and invalidate the snapshot; clients never subscribe to operations-only order rooms. Requests do not overlap. Changing order/account clears the visible snapshot immediately. Hidden tabs do not poll; focus/online events refresh. Terminal orders stop requests.
- `OrderTrackingService` (`apps/api/src/orders`) projects an owner's order, delivery destination, allowlisted rider profile and guarded GPS. It reuses the existing pickup-origin exclusion and 90-second freshness checks. Personal phone numbers and provider identity are not returned.
- `DeliveryTrackingMap` (`packages/api/src/components`) owns Leaflet, map layers, resize and cleanup. Existing rider layers move in place; panning does not reset on every update. Recenter is explicit. Only valid server routing geometry is drawn.
- `RiderSheet` owns the compact/full-height interaction, focus return/trap, Escape handling and reduced motion. The surface uses transform motion: 400ms open, 350ms close, cubic-bezier(0.22, 1, 0.36, 1), with no close delay. A nested cancellation drawer handles its own focus.
- `TrackingActions` connects cancellation, protected calls and chat. Cancellation is confirmed and revalidated by the payment API. Preparation-stage cancellations offer support. Phone buttons use the existing masked-call endpoint, never a rider's private number.
- `TrackingOrderDetails` retains ETA, delivery windows, scheduled starts, address/instructions, handoff PIN, delay notice and support.

## API and configuration

`GET /api/v1/orders/:id/tracking` returns `OrderTrackingView`. Rider GPS uploads via the existing `POST /api/v1/couriers/me/location` flow trigger `courier.location` invalidations on the customer's authenticated user feed for on-the-way orders. Order status changes trigger `order.status` invalidations.

The existing `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_MAP_TILE_URL` configure API and tiles. Socket.IO uses the API origin's `/realtime` namespace and default `/socket.io` path; reverse proxies must forward that path with upgrades enabled.

Optional `TRACKING_OSRM_URL` on the API points to a trusted OSRM-compatible routing service. Coordinates are sent only to this configured service; when unset or unavailable, live GPS/destination markers remain and no invented road route is drawn. Routes are cached for 30 seconds, bounded to 500 entries, and requests time out after 2.5 seconds. This configuration needs deployment-specific routing access.

Rider profiles support `vehicleModel`, `plateNumber` and HTTPS `avatarUrl` through the existing profile-update API. Membership date and completed-order count are derived from stored data. Missing values display as unavailable; no rating is invented because there is no rider-rating source. Calls require the existing Twilio configuration; chat remains available if calling is unavailable.

## Validation

API unit tests cover order ownership, malformed/unknown IDs, rider field allowlisting, terminal/payment state suppression, withheld GPS, and customer-scoped realtime invalidations without raw GPS. Existing customer sanitizer tests are included in the targeted suite.

Browser QA uses temporary synthetic rider coordinates for interaction checks only; these fixtures are removed before handoff. A physical rider GPS-to-customer test requires an authenticated on-duty rider, assigned paid order and fresh GPS outside the protected pickup radius.

## Restaurant matching and journey (September 2026)

The tracking screen now uses bundled PizzaCraft illustrations before pickup and a live map after pickup. The timeline distinguishes confirmation, preparation, ready for pickup, handoff, transit and delivery. Scheduled orders remain separate from restaurant matching. Supporting screens share scoped surface, form and focus styles; bundles are excluded from that override.

`POST /api/v1/dispatch/orders/:orderId/viewed` acknowledges a visible offer from the authenticated provider panel. The server atomically stamps the invited restaurant's pending offer once and invalidates the customer's authenticated socket feed. `matching.notified` and `matching.viewed` are aggregate counts for the current dispatch wave; responses also imply a view. Provider identifiers and offers remain excluded from the customer projection. `fulfillmentStage` adds safe pickup-ready and handoff distinctions without changing existing `customerStatus` consumers.

Native and web foreground push events invalidate the authenticated tracking snapshot. Native notification taps navigate to the matching order; the web service worker opens or focuses its tracking URL. Notifications are opt-in through the tracking disclosure. Delivery requires the existing Firebase client/VAPID configuration, FCM server credentials and registered devices. No notification delivery is simulated in production.

Motion reuses the existing global duration and easing tokens. Status text uses the transitions-dev text-swap recipe with cancellation and a reduced-motion guard; map-marker movement and the rider panel reuse the surface-motion scale.

Design references: [Wolt tracking flow](https://mobbin.com/flows/cc8eab03-154b-44e1-8475-43de235a0b28) and [DoorDash preparation screen](https://mobbin.com/screens/fdd0b708-af32-4297-9cb9-e92ce3b0c18a).
