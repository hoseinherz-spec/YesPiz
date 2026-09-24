# Google JWKS relay (Vercel)

Production relay for Google's public OpenID Connect signing keys. The only
supported route is `GET` or `HEAD /google/oauth2/v3/certs`; every other path or
method is rejected. No credentials or user data pass through this service.
