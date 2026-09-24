# Release follow-up — 22 September 2026

This document supersedes older claims that Plus and group payments are mock-only.
It separates implemented code from credentials, deployment and physical-device acceptance.

## Implemented in this follow-up

- **Plus billing:** authenticated Stripe hosted subscription checkout, server-owned €4.99 / 30-day price validation, reusable open checkout, paid-invoice entitlement reconciliation, signed webhook processing, periodic recovery, cancel-at-period-end and hosted invoice/payment-method management. Failed renewal invoices do not extend access. Previous paid time is retained. No mock enrollment grants access.
- **Group payments:** independent hosted card checkout per participant; fixed reviewed shares, server-side identity/amount/currency/round verification, one order settlement, individual refunds, cancellation/expiry recovery and an admin refund queue. Non-split groups continue through ordinary owner checkout. The existing isolated development mock remains for local tests only.
- **Operations:** admin-only live order/courier map, current status filters, rolling 24-hour counts/captured totals, order-tools links and GPS freshness. Up to the oldest 500 active paid orders are shown with an explicit truncation notice. This does not claim a predictive dispatch simulator or profitability model.
- **Native client:** Google native login, iOS Apple native login with server audience verification, native Stripe PaymentSheet bridge, Apple Pay/Google Pay configuration, payment return schemes and hosted billing via system browser. The native sources are pinned to capacitor-community/stripe 8.2.1; see `packages/native-stripe/UPSTREAM.md`. Its React wrapper is not used.
- **SMS:** existing Twilio Verify adapter hardened with input validation, six-digit codes, delivery-failure cleanup, provider rate-limit mapping and a bounded SDK timeout. `npm run sms:setup` provisions/reuses the Verify service after credentials are supplied and disables local OTP bypass. No SMS is sent by setup. See [SMS setup](SMS-SETUP.md).

## Sandbox resources

The existing Stripe test account was authenticated successfully. `npm run sandbox:stripe`
created/reused the Yespiz Plus recurring price and a billing-portal configuration and saved
the price ID in the ignored API environment file. The official CLI is installed at
`/tmp/yespiz-stripe-cli/node_modules/.bin/stripe`; reinstall `@stripe/cli` if the temporary
directory is cleared. Secrets were not copied into source or documentation.

`npm run stripe:listen` now forwards order, subscription, checkout and invoice events to
the existing signed webhook endpoint. Restart the API after the listener saves its
signing secret. This is a local forwarding command, not a persistent hosted endpoint.

## Configuration still owned by service accounts

- SMS credentials can be supplied later in `apps/api/.env`, as requested. Setup creates the Verify service; Trial recipients must still be verified by the account owner.
- Google Android OAuth registration must match package `com.yespizz.mobile` and the actual signing-certificate fingerprint. iOS needs `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
- Apple login requires the bundle ID enabled for Sign in with Apple and `APPLE_NATIVE_CLIENT_ID=com.yespizz.mobile` on the API. Add Apple to `SOCIAL_AUTH_PROVIDERS` when configured.
- Apple Pay needs a registered `NEXT_PUBLIC_APPLE_PAY_MERCHANT_ID` and matching signing entitlement. Google Pay is enabled explicitly with `NEXT_PUBLIC_GOOGLE_PAY_ENABLED=true`; test keys use its test environment.
- Run `npm run native:configure` after adding native public IDs, then rebuild and sync Capacitor. This sets URL schemes and the Apple sign-in/merchant entitlements; it cannot register developer-account capabilities or create signing profiles.
- FCM/APNs, private S3 storage, geocoding/routing and masked voice calls retain their existing adapters and require their own account configuration and real acceptance tests. No new cloud accounts, live charges, SMS messages or phone calls were made.

## Verification scope

The original Stripe sandbox order tests passed. The extended five-case suite additionally
verifies Plus paid-invoice activation and cancellation, and real group settlement/refunds.
The hosted group payment form is created by the API; settlement is exercised with real test
PaymentIntents, not a claim of completing every hosted form on physical devices.
All 50 API integration tests passed after updating stale catalog and group fixtures.
All 200 API unit tests (34 suites), including SMS/billing tests, passed.
API compilation, admin and mobile webpack production builds and targeted lint checks passed.
Mobile static export used a disposable local API with seeded catalog fixtures; this is
build verification, not a production deployment. Capacitor sync detected all six plugins
on Android and iOS, including the native Stripe adapter.

This Mac has Java 17, an Android SDK and Xcode command-line tools, but no full Xcode.
Android requires Java 21 or newer; iOS signing/building and native wallet, background GPS,
biometric, push and permission tests still require the corresponding tools/accounts/devices.
Do not interpret TypeScript/build success as physical-device certification.
