# Google JWKS relay

This Cloudflare Worker relays only Google's public OpenID Connect signing keys
for API hosts whose egress cannot reach `www.googleapis.com`. It accepts only
`GET` and `HEAD` at `/google/oauth2/v3/certs`, returns no secrets, and preserves
Google's cache policy.

Deploy from this directory with `npm run deploy`, then set the API-only variable:

```env
GOOGLE_JWKS_URL=https://yespizz-google-jwks-relay.<account>.workers.dev/google/oauth2/v3/certs
```

Never point this setting at an untrusted third-party relay and never accept a
key supplied by a sign-in client.
