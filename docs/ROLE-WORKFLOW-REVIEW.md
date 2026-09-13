# Role workflow review — 2026-09-09

This review uses the repository's product promise and implemented screens/API contracts. The roleplay scenarios are engineering simulations, not interviews with customers or staff. The priority is a reliable delivery at a stated time, with kitchen identity hidden from customers.

## Customer: “I ordered to work, then selected home for my next order.”

Needs: the original delivery address and instructions, honest progress and ETA, recoverable payment, accessible courier contact, delivery PIN, and a clear cancellation/refund outcome.

Finding: tracking used the globally selected address. Switching addresses could make an existing order appear to be going somewhere else. The API already returns the delivery address snapshot, but the shared response type and mobile mapping omitted it.

Implemented: tracking uses the order's saved street/city/postcode and instructions; older orders fall back only to the address matching that order's address ID. It never substitutes the current checkout selection.

Follow-up acceptance: delete or change the saved address after checkout; the original snapshot should remain visible. Check interrupted connectivity and switching between multiple active orders, including whether old courier coordinates remain visible. These need dedicated browser coverage beyond the basic tracking address assertion.

## Kitchen operator: “Dinner rush ended; reopen capacity and restore an item.”

Needs: accurate open-order count, adjustable concurrent-order limit, pause/resume, persistent stock availability, realistic preparation estimates, quality checks, and a clear pickup handoff.

Findings: blank capacity submitted an empty update, so an existing limit persisted. The input accepted zero and truncated fractions even though the API required a minimum of one. Inventory read `unavailableItemIds`, but the API returns `eightySixedItemIds`, hiding the actual unavailable state.

Implemented: explicit null clears the limit; both API update DTOs require positive integers when a limit is present. The screen shows remaining capacity, rejects invalid limits and past resume times, and reads the actual inventory field so unavailable items can be restored after reload.

Acceptance: set a cap, clear it, reload, mark an item unavailable, reload, restore it, then accept and prepare an order. Unit tests cover null versus omitted updates and invalid values; browser journeys exercise persistence and restoration.

Follow-up: enforce future pause dates on the server as well; assess whether recurring opening hours and ingredient-level stock are necessary with kitchen staff. Pause expiry and suspension interactions need explicit operational acceptance.

## Courier: “The customer is absent; later GPS permission fails during an emergency report.”

Needs: shift recovery, assigned stop details, accurate instructions, pickup proof, no-answer timing, incident escalation, exact cash collection, and safe recovery when connectivity or device permissions fail.

Findings: the no-answer workflow displayed a static deadline; resolved incidents appeared under active workflows. SOS submission threw when location lookup failed, preventing the incident reaching operations.

Implemented: active no-answer workflows show a live countdown and a follow-up prompt after expiry. Closed incidents are excluded. SOS uses the location requested when its form opens and submits immediately even when GPS is unavailable or permission is still pending, explicitly recording that operations must confirm location. Closing the sheet while a report is submitting is prevented.

Limits: report delivery still requires a working network and successful server response. This is an operations incident report; it does not establish an emergency-service connection. GPS denial and incident countdown need dedicated browser/device acceptance; ordinary card/cash journeys do not certify them.

Follow-up: validate real device permission denial, intermittent network, duplicate taps/retries, post-pickup vehicle breakdown and no-pay resolution with an operator. Several API workflow steps are descriptive records rather than automated actions; do not assume recorded steps mean reassignment, customer contact, or compensation has happened.

## Operations admin: “Several incidents arrive during the rush.”

Needs: critical alerts first, oldest unresolved work visible, order/courier lookup, explicit waiting versus actionable cases, custody-safe reassignment, refunds, and an auditable resolution.

Finding: the queue required manual refresh and showed newest incidents first, making older unresolved work easier to overlook.

Implemented: refresh every 15 seconds while the page is visible, prevent overlapping refreshes, retain the last successful queue on fetch failure, show last update time, search order/courier/type/notes, and filter cases whose wait has finished. Critical incidents remain actionable regardless of a wait deadline and retain their own section. Within each priority, oldest incidents come first. Expired waits have an explicit follow-up label. Failed initial requests no longer imply that there are no incidents.

Limits: “Ready for action” means there is no active wait timer; it does not authorize or perform an operational action. Polling does not guarantee immediate alerts. Dedicated queue filter and polling browser tests remain follow-up work.

Follow-up: incident ownership/claiming, resolution history, notification acknowledgement, and server-driven state transitions deserve the next implementation pass. Review repeated resolution requests and multiple simultaneous incidents before extending automated reassignment.

## Marketplace and website

The website introduces the service; ordering belongs to the customer app. Preserve the blind kitchen boundary across marketing, order views and incident wording. No change to branding or marketing is needed for these workflow fixes.

## Recommended next acceptance exercises

1. A kitchen pauses during an offer wave; existing orders continue and no new order is incorrectly assigned.
2. A courier reports a breakdown after pickup; operations preserves physical custody before any replacement assignment.
3. A customer does not answer, then refuses cash; the system reaches a clear failed-cash/return outcome without permitting false completion.
4. Two admins attempt to resolve the same incident; only one valid transition occurs and its actor/outcome are recorded.
5. A delivery is late; show the customer an honest delay and validate the guarantee policy before enabling automated compensation.

These exercises identify remaining requirements; they are not claims that every scenario has been implemented or tested.

## Validation completed

- API unit suite: 14 suites, 74 tests passed, including the new capacity contract regressions.
- TypeScript checks passed for API, customer mobile, provider panel, admin and courier mobile.
- Lint passed for the four application workspaces and the changed provider API files.
- Browser acceptance: both card and cash customer → kitchen → courier → delivery journeys passed (3.2 minutes), including capacity clearing, inventory restoration after reload and tracking address assertions.
- Diff whitespace check passed. SOS permission failure, countdown behavior and admin polling/filter interactions were reviewed in code and type/lint checked; dedicated browser/device scenarios remain outstanding as noted above.
