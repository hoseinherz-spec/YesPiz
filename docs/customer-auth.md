# Customer authentication and sync

The existing `apps/mobile` Next.js/Capacitor app uses `apps/api` (NestJS) and its existing MongoDB/Mongoose connection. No additional database is required.

## Flow

`/auth/sign-in/` is the customer login entry: Google, Facebook, Apple, or email/password. `/auth/sign-up/` creates an account; `/auth/forgot-password/` uses the existing reset flow. A successful login returns to the validated `next` path. Existing onboarding links forward to login. The old artwork walkthrough remains explicitly available at `/onboarding/?preview=1`.

Social credentials are verified in the API before issuing the existing customer JWT. Providers cannot assign privileged roles. Existing email accounts are not silently linked to new social identities; use the original login method. There is no new account-linking endpoint.

## Configuration

Use the existing MongoDB connection and JWT environment settings. In `apps/api/.env`, configure `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, and `FACEBOOK_API_VERSION` for enabled providers. The public IDs in `apps/mobile/.env.local` must match: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_APPLE_CLIENT_ID`, `NEXT_PUBLIC_APPLE_REDIRECT_URI`, `NEXT_PUBLIC_FACEBOOK_APP_ID`, and `NEXT_PUBLIC_FACEBOOK_API_VERSION`. Keep the Facebook secret only on the server.

Register the deployed web origin with Google and Facebook and the HTTPS redirect URI with Apple. Enable Facebook Login and required app permissions in the provider console. Rebuild the mobile app after changing public environment variables. Provider buttons remain unavailable until both API and client configuration are present. Actual provider consent requires valid credentials and registered origins; automated tests mock provider responses. The existing JavaScript provider SDK integration targets browser login; Capacitor embedded-WebView provider compatibility still requires device testing and potentially native SDK integration before release.

## API

- `GET /api/v1/account/auth/providers`: enabled-provider booleans; never secrets.
- `POST /api/v1/account/auth/social`: existing provider credential verification and JWT response.
- `GET /api/v1/account/profile/me`: authoritative MongoDB profile, including `profileRevision`.
- `PATCH /api/v1/account/profile/me`: bearer-authenticated `{ firstName, lastName, revision }`. The MongoDB update atomically checks the revision and increments it. Stale saves return 409. Unknown properties and invalid/blank names are rejected. Legacy documents without a revision start at zero.

Profile names are synced after login/restoration, on focus, on reconnect, and every minute while visible. Local drafts never override server identity. Login/logout changes sync between browser tabs. Failed saves retain the form and show an error; they are not reported as saved or queued offline. Email and phone are read-only because changing authentication identifiers requires a separate verified-contact flow. Order/address loading continues through the existing API clients. Existing JWT expiration/storage behavior remains in use.

## Verification

Run `npm run check-types --workspace=mobile` and `npm run test --workspace=api -- --runInBand --watchman=false social-login.spec account.service.spec profile-sync.spec`.

For live acceptance, configure providers, sign in with each enabled provider, reload, edit profile names, reopen another device, verify stale edits return 409, and sign out. Verify password login, signup, reset, provider cancellation, and unavailable-provider messaging as well.

## Password recovery

All four customer auth screens share `components/auth/AuthPage.tsx` and `auth.module.css`. Canonical routes are `/auth/sign-in/`, `/auth/sign-up/`, `/auth/forgot-password/`, and `/auth/set-password/`. Legacy routes preserve query strings and redirect to these screens. Set-password accepts the `token` query parameter. The old demo verification route now forwards to real recovery.

Set `RESEND_API_KEY`, `AUTH_EMAIL_FROM` (a verified sender), and `CUSTOMER_APP_URL` in the API environment to deliver reset emails. Production requires an HTTPS customer origin. Unconfigured production delivery fails explicitly. Development without email configuration retains the existing returned-token workflow and opens set-password automatically. Production never returns the raw token. MongoDB stores a token hash and one-hour expiry, and atomically marks tokens used. Signup and reset require 8–72 characters. No live email was sent during implementation.

### Email signup

`/auth/sign-up/` collects first name, last name, and email. `POST /api/v1/account/auth/signup` sends a five-digit code using `RESEND_API_KEY` and `AUTH_EMAIL_FROM`; both must be configured, including for local email delivery. No user or login session is created at this stage.

The code expires after ten minutes and permits five verification attempts. `POST /api/v1/account/auth/signup/verify` exchanges the code and challenge ID for a single-use password setup token. The app keeps this token in session storage and navigates to `/auth/set-password/?signup=1`. `POST /api/v1/account/auth/signup/complete` consumes the token, creates an email-verified customer with a hashed password, and invites the user to sign in. Password setup expires after ten minutes. Existing password-reset links continue to use their separate recovery endpoint.
