# Yespizz Android test APKs

The customer installable APK was rebuilt locally on 2026-09-25. The older
customer and courier test APKs listed below were built from the web assets
deployed on the VPS on 2026-09-13.

- `yespizz-customer-test.apk`: `com.yespizz.mobile`, Android 7+.
- `yespizz-courier-test.apk`: `com.yespizz.courier` (minimum Android version reported by APK metadata).
- API: `http://185.105.239.140:8058`.
- Version: 1.0 (1).

These are release builds signed with the local Android **test/debug key** for
manual installation, not store distribution. Production publishing needs the
project's release signing key and HTTPS configuration.

The customer APK bundles the UI and points to the API at the VPS IP. This
HTTP-only test build allows cleartext traffic and WebView mixed content so the
API can be reached from Capacitor's `https://localhost` origin. The API CORS
allowlist includes that origin. Use an HTTPS API and a production signing key
before distributing a store build.

Builds run in `artifacts/apk-build` without changing the app's source Android
projects. Google Maven dependencies returning 404 upstream were resolved via
its Aliyun mirror using a build-local Gradle init script.

Verification on 2026-09-25: Android release build/lint, APK signatures, APK
package metadata, bundled API URL, live API readiness, and CORS preflight from
`https://localhost`. No device or emulator was connected, so on-device install
and launch, camera, background location, and notifications are untested.
