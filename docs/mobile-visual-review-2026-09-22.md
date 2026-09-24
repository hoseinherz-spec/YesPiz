# Mobile visual consistency review — 22 September 2026

Scope: customer mobile app. The approved `/home`, `/auth/*`, `/onboarding`, `/menu` and `/menu/[id]` compositions are the reference; their source files were not changed in this pass.

## Changes

- Shared secondary-screen styling in `AppFrame`: theme-aware navy/light canvas, restrained auth-style pattern, consistent gutters, surfaces, action shapes, focus outlines and readable accent text.
- Centered secondary headers; reusable auth-style introductions for rewards, group ordering, security, feedback and payment entry.
- Profile, addresses, saved items, help and payment methods share grouped cards and consistent form controls. Settings uses side-by-side theme previews and compact grouped rows.
- Orders use semantic statuses and the menu's primary accent; checkout, cart, receipt and address form spacing is aligned. Chat and receipt fallback states receive complete page framing.
- Bundles no longer put white empty-state text over a bright lime backdrop. Tracking fallback typography matches the other secondary pages.

## Browser evidence

Current-run PNGs are in `.qa/design-audit-2026-09-22/`.

| Surface | Observed state |
| --- | --- |
| Profile, edit profile, settings | Signed-in account; settings/profile also checked in light mode |
| Addresses and new address | Selected test address, map, address form |
| Orders, cart, bundles | Empty states |
| Checkout and payment | Address/summary, local mock-payment choices and recovery state |
| Payment entry | Card-payment introduction |
| Payment methods | Service error and retry state; live saved card display not verified |
| Rewards | Loaded progress; membership checkout unavailable in this mock environment |
| Credit | Loaded zero balance and empty activity |
| Referrals | Introduction, signed-out prompt and loading state |
| Notifications | Empty inbox and preferences entry |
| Help and privacy | FAQ, search and privacy content |
| Group ordering | Create-group form |
| Chat | Composer and courier-not-assigned notice |
| Feedback | No delivered order selected |
| Receipt and tracking | Missing/stale order fallback; active delivery and successful receipt not visually certified in this pass |
| Legacy partner route | Existing demonstration content; no operational actions invoked |

Responsive checks: no document-level horizontal overflow at 320 px for settings, profile, orders, group, address form, checkout, payment, feedback, help and bundles. Main visual checks used 390 × 844. Settings language switching to German was also exercised. No device keyboard, screen-reader, or full WCAG certification was performed.

## Validation and limits

- Mobile TypeScript and ESLint pass; `git diff --check` passes.
- Production compilation and its TypeScript stage passed. Static export was blocked by the disposable test catalog containing no combo products: `/combo/[id]` returns an empty `generateStaticParams()` array. This is a catalog/export prerequisite, not a successful full production build.
- This review verifies styling and the listed browser states. It does not certify every order/payment backend flow or external service configuration.
