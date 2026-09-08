# Stripe sandbox acceptance

`npm run test:stripe-sandbox` exercises Stripe's API and real signed event delivery through the official Stripe CLI. It refuses missing or live keys and never falls back to mock payments. Its database is disposable; it does not use your development or staging MongoDB URI.

## Configure

Install the [official Stripe CLI](https://docs.stripe.com/cli). If you already have a sandbox, use its test secret key. Otherwise, Stripe supports a temporary sandbox:

```sh
stripe sandbox create --email YOUR_APPROVED_EMAIL --non-interactive
```

This sends the supplied identity to Stripe. Temporary sandboxes expire after seven days unless claimed; keep the returned claim URL private. This task uses the existing Yespiz sandbox selected by the user; no new account or temporary sandbox was created.

Copy `.env.stripe-sandbox.example` to `.env.stripe-sandbox` (ignored by Git). Set `STRIPE_SANDBOX_SECRET_KEY` to the sandbox's `sk_test_`, `rk_test_` or `rkcs_test_` key. Set `STRIPE_CLI_BIN` if the CLI is not on PATH. Keys and claim URLs must not be pasted into chat or committed.

```sh
npm run test:stripe-sandbox
```

On this Mac, the MongoDB override is available:

```sh
MONGOMS_SYSTEM_BINARY=/opt/homebrew/bin/mongod npm run test:stripe-sandbox
```

The current task installed the official CLI temporarily at `/tmp/yespiz-stripe-cli/node_modules/.bin/stripe`; that path can be used in the local environment file. Other machines should use their own installation.

## What the suite verifies

- Customer login, menu and order creation through the actual API; authoritative price and a real, non-live PaymentIntent.
- Repeated initiation reuses the intent.
- `pm_card_visa` succeeds; only the CLI-forwarded signed webhook can advance the first order.
- The paid order appears in the kitchen offer feed; customer access to that feed is rejected.
- Invalid webhook signatures fail; replaying an authentic event does not create another payment.
- Cancellation and repeated refund reconciliation produce one successful Stripe refund.
- `pm_card_visa_chargeDeclined` leaves the order unpaid; retry with a successful test payment method uses the same intent.
- `pm_card_threeDSecure2Required` leaves the order waiting for authentication; cancelling it cancels the unpaid intent.
- Cleanup refunds/cancels only test intents created by this run. Failed cleanup reports the intent ID for inspection.

The API 3DS case verifies the pending/cancelled path. The separate browser suite verifies successful challenge completion.

## Browser acceptance

`MONGOMS_SYSTEM_BINARY=/opt/homebrew/bin/mongod npm run test:stripe-browser` starts a disposable API/database, a real Stripe webhook listener and the customer app with its matching test public key. It covers ordinary payment, successful 3DS authentication and declined-card retry. Traces are disabled to avoid retaining payment client secrets. Each test cancels its own order after checking payment capture.

## Interactive checkout

Set `STRIPE_MODE=sandbox` and the sandbox secret key in `apps/api/.env`. Set the matching `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `apps/mobile/.env.local`. Run `npm run stripe:listen`. It uses the configured sandbox key, forwards signed events to API port 8058, and writes `STRIPE_WEBHOOK_SECRET` privately into `apps/api/.env`. Keep it running and restart the API after its ready message. This command refuses live keys. Rebuild/restart the frontend after changing its public key.

Use only [Stripe test payment data](https://docs.stripe.com/testing): successful card `4242 4242 4242 4242`, decline `4000 0000 0000 0002`, and 3DS `4000 0000 0000 3220`, with a future expiry and test CVC. Complete and cancel the 3DS challenge, reload after confirmation, and verify the customer/kitchen/courier order progresses only after confirmed payment.

## Current evidence

On 2026-09-07, all three real API sandbox tests passed against the existing Yespiz test account: successful payment with signed webhook delivery and idempotent refund, decline/retry, and pending 3DS cancellation. Local API unit tests also pass with amount/currency/order/customer/mode checks. All three real browser scenarios also passed: ordinary Visa payment, completed 3DS challenge, and decline followed by a successful retry. All three captured browser payments were independently verified as fully refunded in Stripe. The API suite also verifies the paid order reaches the kitchen offer feed and that the customer cannot access that feed. See [release readiness](RELEASE-READINESS.md) for the remaining staging and device requirements.

The checkout now uses a semantic submit form with keyboard support and Stripe appearance matching the app theme. Browser automation explicitly moves focus out of Stripe’s cross-origin iframe before clicking submit; otherwise the click can be lost during the focus/scroll transition. See [Stripe automated testing guidance](https://docs.stripe.com/automated-testing). These sandbox suites are opt-in and are not part of the default mocked browser CI job.
