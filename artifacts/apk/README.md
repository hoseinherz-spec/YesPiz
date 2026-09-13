# Yespizz Android test APKs

Built from the web assets deployed on the VPS on 2026-09-13.

- `yespizz-customer-test.apk`: `com.yespizz.mobile`, Android 7+.
- `yespizz-courier-test.apk`: `com.yespizz.courier` (minimum Android version reported by APK metadata).
- API: `http://185.105.239.140:8058`.
- Version: 1.0 (1).

These are release builds signed with the local Android **test/debug key** for
manual installation, not store distribution. Production publishing needs the
project's release signing key and HTTPS configuration.

The web UI is bundled inside each APK. HTTP is permitted only for the VPS IP;
Android WebView mixed content is enabled for this IP-based test deployment.
The API CORS allowlist includes `https://localhost`, with explicit user approval.

Builds run in `artifacts/apk-build` without changing the app's source Android
projects. Google Maven dependencies returning 404 upstream were resolved via
its Aliyun mirror using a build-local Gradle init script.

Verification: Android release build/lint, APK signatures, APK package metadata,
bundled API URL, and server readiness/CORS. No device or emulator was connected,
so on-device launch, camera, background location and notifications are untested.
