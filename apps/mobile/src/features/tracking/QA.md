# Tracking implementation verification

Source visual: `/var/folders/hs/p9n84bgx2656zl_bypcg319c0000gn/T/codex-clipboard-f531999c-224f-41d8-9ad3-f2fd0d9a4fd7.png`, 1704 × 1862 pixels, two framed phone screens. Compared app-owned content proportionally without device chrome.

Implementation: `http://localhost:8051/tracking/`. Temporary isolated fixture route rendered the actual map, avatar and sheet components at 393 × 852 CSS pixels; it was removed after verification. Test buttons stood in for external call/cancel/chat effects in this fixture. Production actions use their API clients.

Evidence:
- `/tmp/tracking-map-collapsed.png`
- `/tmp/tracking-rider-expanded.png`
- Copies in `/Users/mahdi/.codex/visualizations/2026/09/21/01a0c3e7-9c65-7810-8e9e-e140b8dd2028/tracking/`

## Results

- Expanded panel measured `top: 0`, `height: 852`, viewport `852`.
- Tapping the summary/avatar and the map rider marker both opened the full-height sheet.
- Escape closed the sheet; focus returned to the summary trigger. Shift+Tab from the back button wrapped to the final action.
- Recenter panned the map. Successive synthetic GPS updates moved the same rider marker (observed y positions 70 then 54 CSS pixels before recenter).
- Browser error log was empty during interaction checks.
- Signed-out production route correctly offers sign-in and does not render a synthetic rider.
- API tests: 11 passed across tracking projection, customer location invalidation, and existing sanitizer tests.
- Type checks passed for mobile, shared API package and backend. Targeted mobile and map lint passed.

## Visual comparison and refinements

Compared original reference alongside collapsed and expanded browser captures. Poppins typography, rider-row hierarchy, three-column stats, info rows, round avatar treatment and fixed pill action bar follow the source. Existing app dark theme is retained. Real map tiles are muted grayscale; no street geometry is invented. Rider photography comes from the profile, with a library-icon fallback when missing. Personal phone numbers are replaced with protected calling. The unavailable rating is shown as a dash instead of inventing a score. This small final copy/icon adjustment follows the captured stats structure.

Fixed a Leaflet stacking issue so attribution and map controls stay behind the expanding panel. Reduced the compact sheet to 280px at this viewport to preserve map space. Fixed focus restoration when React had removed the summary trigger before the open effect. Opening uses 400ms, closing 350ms, smooth-out easing; reduced-motion removes travel. The post-recenter map capture includes tiles still loading at its top; earlier full-map inspection had loaded tiles.

## Remaining validation limits

Physical rider-to-customer GPS delivery, authenticated cancellation/refund, calling, chat submission, routed geometry, offline socket reconnect and a real portrait were not exercised end to end. They require an authenticated assigned active order, on-duty GPS source, and relevant service configuration. OSRM is optional and unset by default; route rendering is suppressed when unavailable. Reduced-motion handling was inspected in code, not emulated in the browser.

Visual interaction checks: passed. Live integration acceptance: requires the configured end-to-end delivery scenario above.

## Restaurant matching redesign — September 2026

- Mobbin references: Wolt's tracking flow and DoorDash's preparation screen. Existing PizzaCraft illustrations, dark surfaces, rounded controls and lime accents provide the visual language.
- Visual fixtures covered matching, preparing, ready-for-pickup and delivered at 390 × 844 with reduced motion. Screenshots are in `.qa/ui/tracking-*.png`; no page errors or horizontal overflow were observed in that fixture run.
- Supporting-route sweep covered orders, cart, checkout, addresses, profile, settings, notifications, help, saved, credit, rewards, referrals, security, feedback, chat, call, group and partner. No page errors or horizontal overflow were observed. Screenshots include loading states where async content had not settled, so this is not a claim that every data/error variant was visually audited.
- API verification: 31 tests across dispatch, restaurant-view acknowledgements, customer projections, tracking, courier tracking and FCM delivery passed. Mobile, API and provider type checks passed; targeted tracking ESLint and `git diff --check` passed.
- Service-worker click handling was exercised in a VM: a valid order notification navigates/focuses an existing same-origin client, and invalid order IDs are ignored.
- The card flow passed from customer address and checkout through restaurant acknowledgement, preparation, rider pickup, PIN handoff and completed order. It also verified the live restaurant-view counter. Evidence: `.qa/ui/matching-live-card.png`.
- Physical GPS accuracy and real Firebase/APNs delivery remain device/deployment checks. The local flow uses browser geolocation and the test payment adapter; it does not charge a real card.
- Cash-flow limitation: the combined run completed cash delivery but the final customer assertion was made with the customer tab hidden (tracking intentionally suspends hidden-tab loads). The test now foregrounds the customer before reloading. Subsequent standalone reruns hit local screenshot/browser-startup timeouts; the latest timed out at login before ordering. Cash is therefore not reported as an end-to-end pass. The test's functional assertions remain intact; screenshot capture now disables animations and has a 60-second allowance.
- Final refinements: notification opt-in appears before the timeline; completed orders link to rating instead of showing disabled delivery controls; singular restaurant counts are localized correctly; browser zoom is enabled. Type checks and targeted tracking lint passed after these product changes. One concurrent type-check attempt raced Next's generated test-type cleanup; the subsequent run with the test server stopped passed.
