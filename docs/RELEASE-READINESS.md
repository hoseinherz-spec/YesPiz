# Order delivery release readiness

This file distinguishes implemented integrations from live-service verification. A green local test is not a production launch approval.

## Implemented

- Server pricing is configurable through Admin → Config. Quotes, creation and reorder use the same calculation; old order prices remain snapshots.
- Customer → Orders → Order options can cancel before kitchen acceptance. Paid cancellations enter durable refund reconciliation. Admin → Refunds shows pending, failed and completed refunds. Automatic reconciliation also covers cancellations from admin review and exhausted dispatch waves.
- Stripe refund requests have stable idempotency keys and persist their provider IDs. Pending refunds are not reported as refunded. Gateway failures are retried; terminal failed/action-required refunds require an operator to inspect Stripe, rather than blindly creating another refund.
- Admin → Courier shifts issues one-time 10-minute codes. Codes are hashed in MongoDB. Current shifts resume after refresh. A courier cannot end a shift with unfinished assigned orders. Kitchen pickup codes and shift codes can be displayed/scanned as QR.
- Courier background location uses the native plugin and native HTTP while on duty. Web uses foreground location updates. Sharing stops when the shift ends or the courier logs out. Location is visible to the customer only during pickup/on-the-way, with a 90-second freshness cutoff.
- Proof uploads accept JPEG/PNG, validate signatures and size, and are tied to an authorized order. S3 objects are private; operations can obtain a 60-second viewing URL. Local storage is development only. Photos are resized and EXIF is discarded in the app. Signature capture is a canvas, not a text URL.
- Customer and courier chat is persisted, authorized by order, and deduplicates retry submissions. Twilio masked calls connect the caller's verified phone to the other verified participant; phone numbers are never returned to the other app. No calls were placed during implementation.
- FCM HTTP v1 sender, token registration/deletion, durable retry queue, invalid-token removal and an admin failure endpoint are implemented. Web and native clients have explicit notification opt-in.
- Address selection and courier tracking use Leaflet. Search uses Geoapify; manual pin/current location remain usable without a search key. Checkout enforces the configured service area on the server.
- Incident reassignment before pickup moves the order into a batch visible to the replacement courier, removes old batch membership, and rotates the pickup code. Already-collected food requires operations to arrange physical custody/return; the system rejects an unsafe reassignment rather than pretending the food is still at the kitchen.
- MongoDB relationship schemas use `Schema.Types.ObjectId`. Audit older databases with `node scripts/order-links.cjs`; after backup and while writes are paused, `node scripts/order-links.cjs --apply` converts existing string references. Duplicate open shifts and payments require review before their unique indexes can be built.

- Realtime connections require a valid JWT, disconnect at expiry and authorize every requested room before joining any. Customers receive a blind status projection through their own user feed; raw order rooms are admin-only.

See [Stripe sandbox acceptance](STRIPE-SANDBOX.md) for the real API/webhook test command and verified results.

## Configure external services

Copy `deploy/.env.staging.example` to `deploy/.env.staging`. Inject secrets through your hosting secret manager; do not commit keys.

| Integration | Required configuration | Live acceptance check |
| --- | --- | --- |
| Stripe | Secret key, public key and webhook signing secret | Test-mode success, 3DS, decline, interrupted redirect, duplicate webhook, cancel/refund including pending/failure |
| Firebase | FCM project, service account/ADC, web config and VAPID | Receive while foreground/background/closed, deny permission, refresh token, logout/shared device |
| S3-compatible storage | Bucket, region/endpoint and scoped credentials | Upload, authorized preview, access denied to another role, persistence after restart |
| Geoapify | API key | Search real local addresses and verify street/entrance/pin; reject addresses outside the delivery area |
| Twilio | Account, auth token, Verify service and voice number | Both participants verify phone numbers; connect call and confirm caller ID masking |
| Hosting | Domains/TLS, secret configuration and service-area coordinates | Full order from public HTTPS URLs, restart API/Redis, inspect logs and refund recovery |

The OSM tile default follows attribution and normal interactive caching. For launch traffic, configure your chosen tile service with `NEXT_PUBLIC_MAP_TILE_URL`; confirm its operating limits. No offline tile scraping is implemented.

## Native setup

1. Add each app's `android/app/google-services.json` and `ios/App/App/GoogleService-Info.plist` from the matching Firebase app. Files are ignored by Git. Add the iOS plist to the Xcode target's resources.
2. Firebase native plugin inclusion is conditional on each platform's config file, so unconfigured development builds do not crash during Firebase initialization. Run Capacitor sync again after installing config files.
3. In Xcode enable Push Notifications and Background Modes (Remote notifications; courier also Location updates), configure signing and upload the APNs key to Firebase. Android courier minimum SDK is 26 for QR scanning.
4. Android builds require Java 21 and the Android SDK. The current environment has Java 17 only. The pinned background-geolocation plugin has a reproducible Swift dependency-range patch in `scripts/native-compat.cjs` (run automatically after npm install); re-evaluate it when upgrading the plugin. This does not replace device testing.
5. Build the web export with the staging API URL, then run `npx cap sync` from each app directory. Inspect the generated Android/Swift package links.
6. Test on real iOS/Android devices: start shift, camera QR, location permissions including background/precise permission, lock phone for more than five minutes, move, lose connectivity/recover, upload photo/signature, finish delivery and stop shift. Explicit OS force-stop is not treated as continuous tracking; stale location is hidden.

Full Xcode is not installed in the current environment. Signing, push entitlements, native compilation and device delivery cannot be verified here without the corresponding tools/devices/configuration.

## Staging and operations

From the repository root:

```sh
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml config --quiet
docker compose --env-file deploy/.env.staging -f deploy/compose.staging.yml up -d --build
```

Ports bind only to localhost. Put your TLS reverse proxy in front of API 8058, customer 8051, courier 8053, kitchen 8084 and admin 8052. MongoDB/Redis are not exposed to the host. This compose deployment is a single-host staging template, not a high-availability production cluster.

- `/api/v1/health/live`: process liveness. `/api/v1/health/ready`: MongoDB and Redis readiness; failure returns 503.
- HTTP logs contain request ID, path, method, duration and response status; no request bodies or authorization headers. Route these logs to your chosen collector. Alert on elevated 5xx, readiness failures, refund retry/failure states and `GET /api/v1/push/failures` (admin authorization required).
- Production refuses weak JWT configuration, wildcard CORS, missing MongoDB/Redis/storage/service area, or Stripe without signed webhooks. Redis failure does not fall back to per-process locks in production.
- Provision the first admin using the protected bootstrap procedure, invite kitchens/couriers and publish the real menu. Never run demo seed in staging/production.
- Before deployment take a MongoDB backup with `bash scripts/staging-backup.sh /secure/backup-directory`. Verify it by restoring into the separate verification database using `bash scripts/staging-restore-check.sh /secure/backup.archive.gz`. Encrypt backups off-host; set S3 retention/versioning according to your operating policy.
- Keep the previous image digest and database backup for rollback. Re-deploy the previous image only when compatible with the current schema; rehearse backup restoration in staging first.
- CI now separates unit/type/lint, integration, browser and application builds. Repository branch protections and host auto-deploy credentials must be configured in the actual GitHub/hosting account.

## Local verification

See [Order flow verification](ORDER-FLOW.md#verified-on-2026-09-07) for test counts, build results and environment limitations.

The latest [multi-user acceptance](MULTI-USER-ACCEPTANCE.md) checks three customers, two kitchens and two couriers, including competing restaurant offers and mixed card/cash multi-stop delivery. It exposed and fixed underpaid cash receipts and empty menu publication. Admin menu editing/visibility and [shared visual consistency](UI-CONSISTENCY.md) were also implemented and browser-checked while preserving the customer app's visual direction.

## Still requires real-world verification

The existing Stripe sandbox was connected and real API payment, signed webhook, kitchen offer visibility, decline/retry, 3DS cancellation and refund checks passed. Three browser scenarios also passed, including successful 3DS challenge completion. No live payments were made. Actual FCM delivery, S3 persistence, phone calls, geocoding coverage, native background behavior, staging deployment and backup restoration still require their accounts/configuration, tools or devices. The adapter implementations and local test doubles do not prove these integrations work in your account.

Scheduled starts and loyalty are implemented. Plus Stripe billing, group settlement and native authentication/payment adapters have now been added; see [release follow-up](RELEASE-FOLLOWUP.md) for current validation, account setup and device acceptance limits.

## Integration references

- [Stripe refunds](https://docs.stripe.com/refunds)
- [FCM HTTP v1](https://firebase.google.com/docs/cloud-messaging/send/v1-api)
- [Capacitor background geolocation](https://github.com/capacitor-community/background-geolocation)
- [Capacitor QR scanner](https://capacitorjs.com/docs/apis/barcode-scanner)
- [Geoapify geocoding](https://apidocs.geoapify.com/docs/geocoding/)
- [Twilio calls](https://www.twilio.com/docs/voice/api/call-resource)
- [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/)
