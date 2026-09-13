# Role and interface review — 12–13 September 2026

This is an engineering role simulation using seeded accounts and a disposable MongoDB database. It does not use production orders or transfer real money. Screenshots and detailed logs are in `.qa/` (ignored by Git).

## Roles and scenarios

- Customer: browse and customize pizza, save an address, checkout, card/cash payment, tracking and delivery PIN, history, reorder review, feedback and support. Screen checks also cover account settings, saved items, credit, referrals, chat, empty/missing-order states, light mode, German language persistence and logout.
- Kitchen: sign in, review offers, adjust/clear capacity, mark stock unavailable and restore it, preparation checklist, seal and photo proof, batching, courier assignment and settlement visibility.
- Courier: shift codes, persisted sessions, pickup code, delivery instructions, GPS location, door PIN, cash receipt and completion; earnings and missing batch/order states.
- Operations: shifts, stock/menu configuration, incident queues, quality, refunds, private feedback, support ownership, partner settlement, growth and team tasks.
- Visitor: landing, onboarding, account entry and recovery screens, missing-page recovery and footer section destinations.

## Changes made in this review

- Preserved valid customer sessions across interrupted navigation and temporary API failures; only an unauthorized response clears authentication. Added rapid-navigation, address persistence and HTTP 503 recovery coverage.
- Fixed a customer address-screen crash: the text wrapper consumed a surrounding form description slot. Plain semantic text now preserves the same app styles without entering the form's component context.
- Fixed courier proof submissions to request a fresh GPS fix rather than a cached prior stop; handled submission failures no longer escape as unhandled promise rejections. The journey exercises invalid PIN recovery before successful delivery.
- Fixed statement hydration for courier/partner screens by reading browser authentication state after the server-compatible first render; added an initial loading message.
- Added accessible login error announcements to admin and kitchen forms.
- Improved mobile panel navigation, active-page visibility, keyboard skip links, desktop content width, heading rhythm and small-screen card shapes.
- Improved light/dark supporting text, keyboard focus contrast and secondary button readability in the customer/courier apps.
- Reduced the pizza detail hero height, added scroll spacing for fixed-action forms, and used matching bundled pizza photos when no uploaded image exists.
- Added a recoverable feedback entry state when no order is selected and arranged scores in five clear, touch-friendly options.
- Replaced dead website footer destinations with working sections and app entry points; improved accent text contrast on light landing sections.
- Shortened the landing pizza story's scroll distance, especially on phones, while preserving its animation sequence.
- Optimized named imports from the large local icon package to reduce unnecessary development compilation work.
- Isolated browser-test builds from running development servers across all five apps and excluded generated test files from lint.
- Fixed false-positive checkout navigation assertions and supplied the required postal code in address fixtures.
- Asserted that checkout actually uses the newly saved address. The former loose URL assertion matched `?from=checkout` on the address form and let the fixture use an older address, causing a delivery geofence rejection.
- Updated the delivery browser fixture to configure real pizza sizes/toppings through the admin API and interact with the current accessible controls.
- Added a reproducible route/screenshot review: `npm run test:e2e:review`.

## Verification

- API unit suite: 19 suites / 109 tests passed; shared form suite: 6 tests passed.
- Backend end-to-end suite: 5 suites / 29 tests passed, including role/tenant isolation, multi-stop delivery, cash requirements, retry/idempotency, refunds, support ownership, wallet concurrency, referral credits and settlement/withdrawal recovery.
- Complete browser journeys: card and cash both passed (3.0 minutes), including custom pizza choices, a newly saved address, kitchen capacity and stock persistence, preparation proof, courier assignment, incorrect-PIN recovery, successful delivery, cash receipt, reorder review, feedback, support resolution and partner settlement visibility.
- Feature browser suite: 5 tests passed, covering publication permissions, referrals, scheduled ordering, form validation, dynamic pizza choices and withdrawal UI.
- Admin browser suite: 2 tests passed, covering shift codes and persistence plus menu creation, publication, editing, hiding and restoration.
- Authenticated screen review: 9 tests passed across customer, operations, kitchen and courier. These cover 48 route entries at desktop/mobile widths, wrong-role login rejection, customer address persistence and recovery after a temporary profile API failure.
- Visitor review: 1 test passed across 8 public/account route entries at both widths, including footer destinations and missing-page recovery. The initial run stopped under local disk pressure; after removing generated test builds, the rerun passed in 51.4 seconds.
- Total: 19 browser scenarios and 144 API/form checks passed. Final workspace lint, TypeScript and whitespace checks passed.

## Reproduction and evidence

Run `npm run test:e2e:review` for the route review. It starts each role surface sequentially to limit development-server memory pressure. Full delivery tests start and stop kitchen, courier and admin servers as their steps require them. Test builds use `.next-e2e`, separate from regular development output.

Local evidence (ignored by Git):

- `.qa/order-review.log`: successful card and cash journeys.
- `.qa/features-review.log` and `.qa/admin-workflows-review.log`: feature/admin results.
- `.qa/final-role-review.log`: authenticated role results; `.qa/visitor-final-review.log`: successful visitor rerun.
- `.qa/role-review-*-results.json`: structured results for each role surface.
- `.qa/review/`: desktop and mobile screenshots, including `admin-menu-mobile.png`, `customer-feedback-mobile.png`, `kitchen-operations-mobile.png` and `courier-earnings-mobile.png`.
- `.qa/review-lint.log` and `.qa/review-types.log`: final static checks.

A route rendering successfully is separate from completing its business workflow; backend integration tests and browser journeys provide the latter evidence.

## Scope limits

Card payment in the ordinary journey uses the test payment implementation. This review does not certify live Stripe, Apple/Google login, SMS/push delivery, native iOS/Android permissions, real-world GPS accuracy or production service configuration. Screen checks use Chromium at 390px and 1360px widths. Arbitrary incident combinations and every possible user input are not exhaustive coverage.
