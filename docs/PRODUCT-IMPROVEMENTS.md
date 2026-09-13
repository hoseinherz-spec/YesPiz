# Yespizz product improvements — 2026-09-11

## Product constraints

Yespizz sells pizza under one customer-facing brand. Preserve the existing theme colors. Never return restaurant identity, pickup coordinates, dispatch ranking or internal quality metrics to customers. Survey scores and original moderation records remain administrator-only. Customers may permit anonymous publication of their comment or an exact excerpt. An administrator selects a pizza from that verified order and approves the public text. Customers see only approved excerpts; restaurant identity, scores and other personal/internal fields are never part of the public response. Withdrawing permission immediately unpublishes the comment without deleting the original survey.

## Implemented

| Role | Working features |
| --- | --- |
| Customer | Pizza-only server catalog and pricing; product ingredients/allergens; delivered-order survey with optional anonymous comment publication; scheduled order start; referral account and rewards; order-linked support and status; credit balance/history and full-order wallet payment; original delivery promise and late-delivery credit; support/feedback shortcuts in order history. |
| Administrator | Verified survey metrics by kitchen with sample counts and separate delivery scores; private support queue with owner/revision checks and audit trail; campaign planning, spend and order attribution; operational tasks with assignment and history; comment publication/revocation, referral reward review, manually recorded settlements, manual withdrawal requests with reserved balances, external payment references and cash-collected report. |
| Restaurant | Weekly hours, timezone and exceptional closures checked during assignment; existing item stock, pause and capacity controls; own settlement statement; kitchen checklist and handoff quality controls. |
| Courier | Own earnings statement alongside existing sessions, pickup/delivery proof and incident workflows. |

New API modules: care, wallet, finance and growth. Survey feedback is immutable and unique per verified delivered/completed order. Support retries use a unique customer/request key. Balance and wallet receipts update atomically in the same user document; repeated payment/refund keys cannot double debit or credit. Manual settlement approval does not move money. Partners request their approved, due balance. Administrators review the request, make an external manual payment and record its reference. Automatic partner transfers are disabled.

The customer GPS endpoint withholds pickup-stage locations and locations within 300 metres of the assigned kitchen. It exposes only fresh locations during delivery; no origin or pickup route is returned. Branding on physical packaging, receipt printers and external communications remains an operational responsibility.

## Existing data and operating setup

- New catalog items are pizza. Existing items have to be explicitly classified: open Admin → Menu and use **Confirm this item is pizza** only for actual pizzas. Unclassified records remain available in admin, but cannot be bought or published to customers. No existing data is deleted or guessed from product names. The seed now creates only pizzas.
- Enter actual ingredients and allergens in the menu editor. Do not infer allergen-free claims from an empty list.
- Hours are opt-in. Set the kitchen timezone and all opening periods before enabling. Split overnight service at midnight. An enabled schedule with no periods means closed.
- Configure the late-delivery credit amount in the existing app configuration. Wallet spending currently requires enough credit for the entire order; split payment is not implemented.
- Campaign links use `?campaign=CODE`. Attribution accepts an active campaign within its configured dates. Campaign codes are not coupons; the app does not send messages, buy ads or run promotions automatically.
- Finance operators enter the agreed settlement amount and due date, then record an actual external transfer reference. The cash report shows collections, not verified cash remittance. Manual withdrawal requests reserve approved due settlements; bank receipt confirmation and accounting integrations are not automatic.
- Create the new collection indexes before production traffic. Test runs use disposable MongoDB and local payment mocks, never real customer data or live payments.

## Not included in this implementation

Group orders, subscriptions, split wallet/card payment, automatic bank receipt confirmation, cash-remittance reconciliation, ingredient-level inventory, granular staff permissions beyond existing roles, courier custody transfer and live production notification delivery need further implementation/integration. POS integration and in-person ordering are explicitly out of scope. Native iOS/Android release validation and production rollout are separate from local browser checks.

## Verification

- API unit tests cover allocation, hours, role-safe projection, payments, SLA and existing operations.
- `apps/api/test/care-business.e2e-spec.ts` uses real Nest guards, validation and disposable MongoDB for pizza-only enforcement, feedback/privacy, support ownership, concurrent wallet spending/refunds, original-promise compensation, settlements and marketing tasks.
- `e2e/order-flow.spec.ts` exercises card and cash orders across customer, kitchen, courier and admin, then private feedback, support and partner statements.
- Workspace TypeScript checks run directly because the local Turbo binary cannot spawn in this environment.

Check the recorded test output for the current execution result; these descriptions are test coverage, not a production readiness claim.

## Earlier local results

- 79 unit tests passed (15 suites).
- 21 API integration tests passed (5 suites), including all seven new business tests.
- API production build passed.
- Lint: no errors across the six applications after fixes; existing style/unused-code warnings remain in API and website.
- TypeScript checks passed for API, customer, admin, provider, courier, shared API and website. The final website check passed with incremental caching disabled after the disk-space interruption.
- Browser: the card flow reached delivery and submitted/reloaded private feedback in one run. Full verification of support, admin finance and both payment flows remains incomplete: repeated `ENOSPC` failures interrupted Next and screenshot writes. The tests remain in the repository for a rerun when sufficient space is available.
- Native release builds and deployment were not performed.


## Comment publication

- The original comment and scores are never deleted or rewritten by publication controls.
- New surveys default to private. Historical private comments also stay private until their author grants permission from the submitted feedback page.
- Administrator publication requires a nonempty exact excerpt of the original text and a pizza actually present in that order. A known source restaurant name/address is rejected; the reviewer also checks meaning and personal information.
- The public endpoint returns only a comment ID, approved text and publication date, at most 20 per pizza. The UI calls them selected verified-order comments, not an exhaustive or representative rating.
- Revision checks protect simultaneous moderation and permission withdrawal. Granting permission after withdrawal requires a fresh administrator approval.

## Scheduled ordering

The selected time is the **order start**, not an arrival slot. Checkout offers ASAP or a start in 45 minutes, one hour or two hours. The server accepts ISO start times 15 minutes to seven days ahead. Payment holds the order in `SCHEDULED`; the worker releases due paid/authorized orders every 30 seconds using the same allocation lock as cancellation. Kitchen availability is evaluated when released. An order with no eligible kitchen is surfaced to operations. The customer can cancel before preparation; existing refund handling applies. This does not reserve future kitchen capacity or guarantee an arrival appointment.

## Referral rewards

Admin → Growth configures the credit per person; the default €0 disables new rewards. A customer applies a friend's code before their first paid order, once per account. The amount is frozen when the referral is recorded. After a completed paid, non-test order of at least €10, an administrator reviews and approves credit for both accounts. Atomic wallet receipts allow recovery after an interrupted approval without duplicate credit. The customer's summary has counts and their own status, not invited customers' identities or order IDs.

## Manual partner withdrawals — supersedes the earlier Stripe transfer design

All customer orders belong to Yespizz; no in-person purchase or customer-to-restaurant contact is supported. Stripe customer payments remain platform payments. Automatic partner transfers and account binding are disabled even when an old Connect environment flag is present. Historical transfer records are retained for reconciliation.

Partners request the full approved, due, unpaid balance and enter private bank payment details. Only one active request per partner is allowed. Its settlement IDs and amount are frozen. An administrator approves or rejects with a partner-visible note. Approval does not send money. After making the actual external payment, an administrator records the reference and marks the request paid. Reserved settlements cannot be paid independently. Interrupted recording resumes with the same reference; a different reference is rejected. Rejection releases the reservation. Customer roles cannot access these routes.

## Follow-up validation

- 81 unit tests passed in 15 suites.
- 26 API integration tests passed in five suites, including 12 business tests for comments/permission withdrawal, scheduled starts, referrals and interrupted-transfer recovery with a fake Stripe client.
- The smaller browser test submitted feedback with publication permission and verified the initial unpublished state. It was stopped during administrator navigation when system free disk fell below 100 MB. Full visual approval/revocation, scheduled checkout and referral/finance UI verification remain incomplete; rerun `playwright.features.config.ts` when resources are available.
- No real external payments, production deployment or native release builds were run.

- Follow-up TypeScript checks passed for API, customer, admin, shared API, provider and courier. Customer/admin lint passed with no errors; the API production build also passed.

## Dynamic pizza menu implementation

- Stable pizza identity across copied menu versions; verified comment lookup resolves historical item IDs. Favorites now use stable IDs for new saves.
- Per-pizza sizes/styles with independent full prices; reusable choice structure with required/optional groups, minimum/maximum selections, disabled options, variant restrictions and extra-price overrides by size. Every ordered choice and price is validated on the server.
- Dynamic customer categories, ordering and multiple category placement. Hiding every category containing a pizza prevents checkout. Cloning copies category mappings and existing restaurant item-unavailability flags.
- Admin edits description, image, gallery, tags, public ingredients/allergens, typed custom information with explicit public/internal visibility, and weekly availability with timezone and closure dates.
- Internal recipes and quality settings are editable. New orders snapshot recipe requirements and selected labels; customer responses exclude private recipe data.
- Copy a menu to a draft, preview the customer's choice controls, publish immediately, schedule publication or cancel the schedule. Publication is serialized; invalid scheduled publications record an error.
- Legacy pizzas retain their old size/extra controls until explicitly configured. Customized pizzas require reviewing current choices when reordering rather than silently substituting options.
- Discount codes support fixed/percentage discounts, minimum pizza subtotal, per-order cap, validity dates and pause/activate. One code per order; reuse is unlimited while active. Server quotes and persisted orders carry the discount. Codes have no global campaign-budget or per-customer usage limits yet.
- The first builder does not yet support reusable global option libraries, arbitrary cross-group dependencies, quantities per individual topping, ingredient stock deduction or subscriptions.

## Latest validation, 2026-09-11

109 unit tests passed. The combined integration run passed all 28 test cases, but its lifecycle suite exceeded the five-second database cleanup timeout; this run is not recorded as a fully passing suite. A focused cleanup-timeout rerun and frontend checks are recorded separately in the task. New tests cover dynamic pricing, choice restrictions, private fields, availability, coupon limits, withdrawal reservations, approval permissions, rejection and interrupted payment recording. No real payment or production deployment was performed.


Final follow-up: the lifecycle cleanup rerun passed all 11 cases with a 30-second timeout. The expanded business suite passed all 15 cases, including multi-category scheduled publication and comment continuity after cloning. API, admin, mobile, provider, courier and shared API TypeScript checks passed; admin/mobile lint passed. Isolated browser tests passed for the admin builder/manual-withdrawal screen and customer customization-to-cart flow. These focused checks do not replace full native release validation. Screenshots are in .qa/ui/dynamic-pizza-builder.png, .qa/ui/manual-withdrawals.png and .qa/ui/dynamic-pizza-cart.png.

API build passed. The final customer browser rerun also passed an explicit checkout-button overflow check at 390 px after the layout correction. The focused admin and customer browser tests can be run separately with YESPIZZ_FEATURE_SURFACE=admin or mobile to keep memory use bounded.
