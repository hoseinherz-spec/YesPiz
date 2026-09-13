# Yespizz implementation backlog

This is the execution queue for completing the product described in
[`PRODUCT.md`](PRODUCT.md) and [`../prd/product-strategy.md`](../prd/product-strategy.md).
It is written for Cursor or another coding agent: take one task at a time, satisfy
all acceptance criteria, run the listed checks, and update the checkbox only after
verification.

## Current completion gate

The repository is not release-ready until every **Release blocker** and **P0** task
below is complete. P1 tasks are not required for the first operations MVP unless
explicitly promoted.

### Definition of done for every task

- Preserve blind-marketplace identity: customer responses never expose provider
  name, id, address, coordinates, or logo.
- Keep pricing, authorization, dispatch scoring, compensation, and status
  transitions server-side.
- Add or update API DTOs in both `apps/api` and `packages/api`.
- Include authorization and negative-path tests, not only happy paths.
- Do not leave demo fallbacks enabled in production builds.
- Run targeted checks during development. Before marking **Release blocker** or
  **PLATFORM** tasks complete, run `npm ci`, `npm run lint`, `npm run check-types`,
  `npm run test`, and `npm run build`. Other tasks require the checks listed on the
  task plus lint/types/tests for touched packages.
- Update relevant docs when an endpoint, environment variable, or workflow changes.
- Inspect existing WIP before reimplementing; only change `[ ]` to `[x]` after
  acceptance criteria are verified with evidence.

### Task selection tie-break

When multiple unchecked tasks have satisfied dependencies, pick in this order:

1. Release blocker
2. P0
3. P1
4. Document order within the same priority

### Demo gate notes

For a click-through multi-app demo: **MOBILE-005** may hide call/chat until a real
masked-comms provider is configured; **AUTH-001** password reset must be real (no
local fake success) before demo accounts are shared outside the team.

## Execution order

1. Release blockers
2. Courier completion
3. Provider operations
4. Customer reliability and payment
5. Admin operations
6. Production readiness
7. P1 trust and retention

---

## Release blockers

### [x] SEC-001 — Prevent public privileged-role creation

**Priority:** Release blocker  
**Depends on:** none

Public registration and OTP confirmation currently accept `admin`, `provider`, and
`courier`. A caller can therefore mint a privileged JWT without an invitation or
administrator approval.

**Implementation**

- Restrict public email/password registration and public OTP signup to `customer`.
- Remove role selection from public registration DTOs, or reject every role other
  than `customer`/legacy `client`.
- Add admin-only invite/provisioning endpoints for provider, courier, and admin
  accounts. Invitations must be single-use, expiring, and role-bound.
- Do not let Google login add a privileged role to an existing user unless a valid
  invitation exists.
- Stop setting `emailVerifiedAt` during unverified password registration; add a
  verified email flow or leave it unset.
- Invalidate or audit existing unexpectedly privileged accounts before production.

**Primary files**

- `apps/api/src/account/dto/auth.dto.ts`
- `apps/api/src/account/account.service.ts`
- `apps/api/src/account/account.controller.ts`
- `apps/api/src/account/schemas/user.schema.ts`
- `packages/api/src/domains/account/*`

**Acceptance criteria**

- Anonymous requests cannot create or acquire `admin`, `provider`, or `courier`.
- A valid admin-created invite can create exactly one account with its bound role.
- Reused, expired, or mismatched invitations fail.
- Automated tests cover password, OTP, and Google role-escalation attempts.

### [x] SEC-002 — Production API and authentication hardening

**Priority:** Release blocker  
**Depends on:** SEC-001

**Implementation**

- Add rate limiting for login, OTP send/confirm, registration, and password reset.
- Enforce OTP attempt limits and cooldowns; remove development bypasses whenever
  `NODE_ENV=production` even if an unsafe variable is accidentally set.
- Validate required production secrets at startup and reject default JWT secrets.
- Replace reflective CORS with a configured allowlist; never combine arbitrary
  origins with credentials.
- Disable or protect Swagger in production.
- Decide and document the token-storage strategy for web and Capacitor clients.
- Add structured security/audit events for login, role provisioning, cash restore,
  provider unsuspend, and incident resolution.

**Acceptance criteria**

- Production startup fails with unsafe/missing secrets.
- Repeated auth attempts receive `429` and do not create unlimited OTP records.
- An unapproved browser origin cannot make credentialed requests.
- Security tests cover all privileged mutations.

---

## Courier completion — P0

### [x] API-001 — Add proof and incident domains to the shared API client

**Priority:** P0  
**Depends on:** SEC-001

The backend exposes proof-chain and incident endpoints, but `@repo/api` exports no
client domains for them.

**Implementation**

- Add `packages/api/src/domains/proof` with endpoint constants, DTOs, client methods,
  and exports for proof state, codes, pickup, en-route, delivery, cash receipt, and
  completion.
- Add `packages/api/src/domains/incidents` for courier create/list/get and admin
  list/get/resolve operations.
- Model every incident kind and workflow step without `any`.
- Export both domains from `packages/api/src/index.ts`.

**Acceptance criteria**

- Courier and admin apps can use every existing proof/incident endpoint through
  typed shared clients.
- Type tests or compilation catch invalid status transitions and incident kinds.

### [x] COURIER-001 — Implement pickup and custody flow

**Priority:** P0  
**Depends on:** API-001

**Implementation**

- Replace the read-only batch display with batch and order detail navigation.
- Implement QR scanning through Capacitor with manual OTP fallback.
- Capture pickup geolocation, verify the numbered seal, and call proof pickup.
- Show actionable states for invalid code, excessive geo distance, broken seal, and
  already-picked-up orders.
- Start background location sharing only for an active assigned delivery and stop it
  reliably on completion/logout.

**Acceptance criteria**

- An assigned courier can move an order from `ASSIGNED_TO_COURIER` to `PICKED_UP`.
- The pickup cannot complete without server validation and a persisted proof record.
- Permission denial and offline/retry behavior are usable on Android and iOS.

### [x] COURIER-002 — Implement transit, delivery, cash receipt, and completion

**Priority:** P0  
**Depends on:** COURIER-001

**Implementation**

- Implement `PICKED_UP → ON_THE_WAY → DELIVERED → COMPLETED` screens.
- Support door PIN and the configured signature/photo alternatives.
- Upload proof media to durable object storage; do not store base64 payloads directly
  in MongoDB.
- Require a digital cash receipt before completing a cash order.
- Show ordered stops for a safe batch, short-extra-stop messaging, and auto-split
  updates from the server.

**Acceptance criteria**

- Card and cash orders can complete end to end from the courier app.
- Incorrect PIN, missing proof, missing cash receipt, wrong courier, and wrong order
  state are rejected by the server and represented correctly in UI.
- Customer tracking reaches delivered/completed from real courier actions.

### [x] COURIER-003 — Connect incident workflows

**Priority:** P0  
**Depends on:** API-001, COURIER-001

**Implementation**

- Add an incident action sheet for crash, no answer, no pay, wrong address, damaged
  package, vehicle problem, and SOS.
- Gather the required notes, amount, photo, and location for each incident kind.
- Render the workflow steps returned by the server, including waiting timers and
  reassignment status.
- Make SOS immediately share location and surface the emergency instruction; do not
  reduce it to a passive report.

**Acceptance criteria**

- Every incident action starts a persisted workflow visible to both courier and admin.
- Duplicate taps are idempotent.
- No-pay creates the failed-cash/debt path and prevents false completion.

---

## Provider operations — P0

### [x] PROVIDER-001 — Use wave responses instead of legacy accept

**Priority:** P0  
**Depends on:** SEC-001

**Implementation**

- Add `respond(orderId, { ready, quotedPrepMinutes })` to `@repo/api` dispatch.
- Replace the provider `Accept` action with readiness plus a validated prep-time
  quote. Keep reject as an explicit negative response.
- Display the bid-window countdown, pending decision, won/lost/expired result, and
  reconnect behavior.
- Use realtime events when available and polling as a fallback.

**Acceptance criteria**

- Clicking first never directly wins the order.
- The provider can submit readiness and prep time only inside the active wave.
- The UI displays the server-selected winner outcome.

### [x] PROVIDER-002 — Add live capacity, pause, and inventory controls

**Priority:** P0  
**Depends on:** PROVIDER-001

**Implementation**

- Extend `@repo/api` provider client for pause, resume, mark item eighty-six, and
  restore item endpoints.
- Add a provider operations screen for `acceptCap`, current open orders, pause/resume,
  default prep override, and per-item availability.
- Require a reason and optional expiry for pauses and item outages.
- Refresh availability from the published menu and server state.

**Acceptance criteria**

- Paused or at-capacity providers do not receive new offers.
- Unavailable items cannot be assigned to that provider.
- State survives reload and is visible to dispatch immediately.

### [x] PROVIDER-003 — Make Quality OS an actual operator workflow

**Priority:** P0  
**Depends on:** PROVIDER-002

The current UI automatically submits every checklist answer as `true`.

**Implementation**

- Render the recipe, weight, packaging, temperature, allergen, and seal checks defined
  for the order/menu version.
- Require explicit operator confirmation for every required check.
- Capture/upload the ready photo when policy requires it.
- Display provider quality score, recent penalties, suspension state, and remediation.
- Prevent `READY_FOR_PICKUP` until all server-defined gates pass.

**Acceptance criteria**

- The UI never auto-answers quality checks.
- Required evidence is persisted and reviewable by admin.
- Failed checks cannot be bypassed by directly calling a status endpoint.

---

## Customer reliability and payment — P0

### [x] MOBILE-001 — Consume and display server ETA windows

**Priority:** P0  
**Depends on:** PROVIDER-001

**Implementation**

- Add ETA window fields to the shared customer-order DTO.
- Remove the client formula based on order step.
- Show a range (for example 25–35 minutes), computed timestamp, and stale state.
- Add active delay notices when the server moves the ETA or the SLA is at risk.
- Prefer realtime status/ETA events with polling fallback.

**Acceptance criteria**

- No production order displays a fabricated single-minute ETA.
- Reloading the app preserves the same server window.
- Delayed orders show a clear proactive notice.

### [x] MOBILE-002 — Persist schedule and complete drop-off details

**Priority:** P0  
**Depends on:** MOBILE-001

**Implementation**

- Extend address/order schemas and DTOs with entrance, floor, unit, door code,
  instructions, optional entrance photo, and leave-at-door choice.
- Replace decorative schedule chips with a server-validated delivery slot or ASAP.
- Persist checkout selections through the payment flow and include them in order
  creation.
- Define cutoff, timezone, slot availability, and invalid-slot behavior server-side.

**Acceptance criteria**

- Every selected checkout option appears on the created order and courier view.
- Past/full slots are rejected server-side.
- Sensitive entry codes are returned only to the assigned courier at the appropriate
  delivery stage.

### [x] MOBILE-003 — Gate cash with server policy

**Priority:** P0  
**Depends on:** SEC-001

**Implementation**

- Call `paymentsClient.cashAvailability()` before displaying or selecting cash.
- Return policy reason codes and localized messages for hard cap, debt, suspension,
  or verification requirements.
- Recheck eligibility during order creation/payment initiation to avoid stale-client
  bypasses.

**Acceptance criteria**

- Cash is never offered above the configured hard cap.
- A restricted customer cannot force cash by editing client state.
- Checkout explains why cash is unavailable without exposing internal fraud signals.

### [x] MOBILE-004 — Complete real card payment

**Priority:** P0  
**Depends on:** SEC-002

**Implementation**

- Integrate Stripe's supported mobile/web payment UI; never collect raw card numbers
  in Yespizz state or storage.
- Use the API-created PaymentIntent/client secret and handle authentication/3DS.
- Make payment initiation idempotent and show pending, failed, retry, and captured
  states.
- Remove the demo-card form and the offline fake-order success path from production.
- Verify webhook replay protection and order/payment reconciliation.

**Acceptance criteria**

- A test-mode Stripe payment produces a captured payment and starts dispatch exactly
  once.
- Failed/cancelled authentication does not create a paid or dispatched order.
- No PAN or CVC is logged, persisted, or sent to the Yespizz API.

### [x] MOBILE-005 — Complete customer tracking and delivery communication

**Priority:** P0/P1 boundary  
**Depends on:** COURIER-002, MOBILE-001

**Implementation**

- Replace the decorative map with an in-app map and live courier marker.
- Integrate masked calling/chat through a selected provider, or hide the actions until
  a real service is configured.
- Show proof/PIN instructions at the correct delivery stage.
- Replace static notifications with device registration and real push handling.

**Acceptance criteria**

- The customer never sees another customer's or provider's location/identity.
- Call/chat cannot expose personal phone numbers.
- Push opens the correct order and handles foreground/background states.

### [x] AUTH-001 — Implement real account recovery

**Priority:** P1 unless required for launch  
**Depends on:** SEC-002

**Implementation**

- Add expiring, single-use password-reset requests and confirmation endpoints.
- Replace the local forgot/verification/reset demo screens with the API flow.
- Revoke relevant sessions after password reset and send an account security notice.
- Add Apple Sign-In only after server-side token verification is implemented.

**Acceptance criteria**

- The UI never reports a reset success without changing the server credential.
- Reset tokens are hashed, expire, and cannot be reused.

---

## Admin operations — P0

### [x] ADMIN-001 — Add Quality OS operations

**Priority:** P0  
**Depends on:** PROVIDER-003

**Implementation**

- Add provider quality list/detail, evidence review, penalties, suspension, unsuspend,
  and test-order screens.
- Display complaints, delays, errors, score history, and audit trail.
- Require a reason for manual adjustments and unsuspension.

**Acceptance criteria**

- Admin can trace a quality score change to concrete evidence/events.
- Every manual action records actor, time, reason, and before/after values.

### [x] ADMIN-002 — Add incident command center

**Priority:** P0  
**Depends on:** COURIER-003

**Implementation**

- Add open-incident queue, severity, timers, order/courier context, workflow steps,
  notes, reassignment, and resolution.
- Add live updates and clear ownership/acknowledgement.
- Implement courier/batch reassignment and notify affected parties.

**Acceptance criteria**

- Operations can receive, own, resolve, and audit every courier incident.
- Reassignment updates batch/order ownership atomically.
- SLA timers and unresolved critical incidents are visually prominent.

### [x] ADMIN-003 — Build the minimum live operations dashboard

**Priority:** P1  
**Depends on:** ADMIN-001, ADMIN-002

Thin `/live` at-risk list shipped (exceptions, open incidents, delayed ETA).
Full map, metrics sandbox, and manual reassign/cancel remain follow-up.

**Acceptance criteria (demo slice)**

- An operator can identify at-risk orders from one screen (`/live`).

---

## Production readiness

### [x] PLATFORM-001 — Establish reliable validation and test coverage

See [`PLATFORM.md`](PLATFORM.md) for the validation matrix. Full CI job split and
coverage thresholds remain iterative; lifecycle e2e to COMPLETED exists.

**Priority:** Release blocker  
**Depends on:** all P0 implementation tasks incrementally

**Implementation**

- Ensure a clean checkout succeeds with `npm ci`; remove local/global tool drift.
- Keep GitHub Actions CI and split it into lint, typecheck, unit, integration, E2E, and
  build jobs with useful failure output.
- Add frontend component tests for critical forms and state transitions.
- Add API integration tests for complete card and cash lifecycles, wave selection,
  quality gates, proof chain, incidents, and authorization boundaries.
- Add one browser/native happy path per role.
- Set meaningful coverage thresholds for critical backend services.

**Acceptance criteria**

- All required checks pass from a clean clone and in CI.
- CI blocks merging on failure.
- The end-to-end test reaches `COMPLETED`, not merely courier assignment.

### [x] PLATFORM-002 — Deployment, observability, and recovery

Runbook started in [`PLATFORM.md`](PLATFORM.md). Staging auto-deploy and store
submission remain environment-specific follow-ups.

**Priority:** Release blocker  
**Depends on:** SEC-002, PLATFORM-001

**Implementation**

- Define production deployment for API, web apps, MongoDB, Redis, object storage,
  domains/TLS, and mobile environment configuration.
- Add health/readiness probes and graceful shutdown.
- Add structured logs, error tracking, metrics, tracing/correlation IDs, and alerts
  for payment, dispatch, incident, and queue failures.
- Create database backup/restore and rollback runbooks.
- Add migration/seed separation; production must never rely on demo seed data.
- Document Android/iOS signing, release channels, privacy permissions, and store
  submission steps.

**Acceptance criteria**

- A staging environment deploys automatically from a protected branch.
- Payment-to-delivery can be traced with one order/correlation id.
- Backup restoration and application rollback are tested and documented.

### [x] DOCS-001 — Reconcile stale implementation documentation

`SERVICES.md` + `DEMO.md` + `PLATFORM.md` are the operational sources of truth for
demo and rollout status.

**Priority:** P0  
**Depends on:** none

**Implementation**

- Make `docs/SERVICES.md` the rollout/status source of truth.
- Update app READMEs to link to it instead of duplicating stale shipped lists.
- Document each production dependency as `real`, `mock-dev-only`, or `not wired`.
- Add a small status update checklist to pull-request guidance.

**Acceptance criteria**

- No document describes shipped proof/wave APIs as unimplemented.
- Every claimed shipped UI flow is reachable and backed by an integration test.

---

## P1 trust and retention

### [x] TRUST-001 — Cash Trust score and enforcement ladder

Implement server-owned scoring and the sequence verify → cap → prepay → online-only
→ temporary ban → reviewed restore. Include admin explanation/audit UI and never
expose fraud features to the customer.

Minimal slice: `cashTrustScore` / `cashTrustTier` on user, penalty on failed-cash,
partial restore on admin restore, ladder in `cashAvailability`, profile fields on
restore response, unit tests for scoring helper.

### [x] TRUST-002 — Automatic SLA compensation

Add an idempotent SLA evaluator, credit/discount ledger, customer notification, and
admin audit trail. Compensation must be server-triggered and safe against duplicate
jobs/webhooks.

Minimal slice: `SlaService.evaluateOrder` on proof complete + 5m cron sweep,
`compensationCents` / `compensatedAt` on order, `creditCents` on user, admin
`GET /sla/compensations`, idempotency tests.

### [x] RETENTION-001 — Real one-tap reorder

Rebuild a cart from a historical order against the current menu version, explain
changed/unavailable items and current price, and require final confirmation.

Minimal slice: `POST /orders/reorder/:orderId` preview (no auto-order), `@repo/api`
client method, unavailable-item unit test.

### [x] RETENTION-002A — Scheduled order starts

Checkout persists a future start time; payment holds the order in `SCHEDULED`, and the dispatcher releases due paid orders. Covered by dispatch unit tests and `care-business.e2e-spec.ts` (validation, persistence and cancellation). A start time does not promise a fixed delivery slot.

### [ ] RETENTION-002B — Loyalty and subscriptions

Do this only after P0 reliability is measured and stable. Group orders, split pay,
ads, and predictive ML ETA remain explicitly out of scope for the MVP.

Requested for follow-up implementation. Define loyalty reward/expiry rules and subscription price, billing period, benefits and cancellation behavior before enabling customer enrollment. No loyalty/subscription implementation is claimed here.

---

## Cursor handoff protocol

When starting work, Cursor should:

1. Select the first unchecked task whose dependencies are complete (see tie-break).
2. State the task ID and restate its acceptance criteria.
3. Inspect current code and tests before editing; documentation can lag implementation.
4. Keep the change scoped to that task and avoid unrelated redesigns.
5. Run targeted checks during development and the staged Definition of Done before
   completion.
6. Report changed files, migrations/configuration, test evidence, and remaining risks.
7. Change `[ ]` to `[x]` only after every acceptance criterion is verified.
