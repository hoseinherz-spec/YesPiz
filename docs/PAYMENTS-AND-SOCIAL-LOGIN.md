# Payments and social sign-in

The customer web app uses Stripe Payment Element for cards and Klarna, and Express Checkout Element for Apple Pay and Google Pay. These all use the existing online (`card`) order channel; Stripe stores the actual payment instrument. Cash and Yespizz credit continue to use their existing flows.

Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Enable Klarna in Stripe and register the HTTPS checkout domain for wallets. Wallet buttons appear only when Stripe reports support for the browser/device and customer. Klarna availability also depends on account, country, amount and customer eligibility. Redirects return to the saved order and the API verifies payment before completing checkout. Existing PaymentIntents retain their original methods; create a fresh order when testing the new methods.

For Google, configure a Web OAuth client, authorize the customer app's exact origin, and set the same client ID in `GOOGLE_CLIENT_ID` (API) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (mobile web build). The API verifies tokens with Google's OIDC keys. If Google blocks the API host's outbound IP, route the host through an allowed egress network or set `GOOGLE_JWKS_URL` to an operator-controlled HTTPS relay that returns Google's unmodified JWKS. Never accept keys supplied by the signing-in client.

For Apple, enable Sign in with Apple, configure a Services ID and register the website domain and HTTPS return URL. Set the Services ID in `APPLE_CLIENT_ID` and `NEXT_PUBLIC_APPLE_CLIENT_ID`; set the registered return URL in `NEXT_PUBLIC_APPLE_REDIRECT_URI`. The Apple JS popup delivers the identity token to the page. No provider secret belongs in a `NEXT_PUBLIC_` variable.

Login and signup share these providers alongside the existing email and phone flows. The API verifies signatures, audience, issuer, expiry and nonce; it only creates customer accounts. Existing email accounts are not silently linked: users must use their original sign-in method. Disabled accounts are rejected. Missing configuration leaves the corresponding buttons disabled with an explanation.

Rebuild the web app after setting public environment variables. These integrations use browser SDKs. The packaged Capacitor applications still need native OAuth/system-browser handling and native wallet integration; do not assume support inside embedded webviews. Live provider authentication and wallet eligibility must be checked on the registered HTTPS deployment with configured provider accounts.

References: [Stripe Express Checkout](https://docs.stripe.com/elements/express-checkout-element), [Stripe Payment Element](https://docs.stripe.com/payments/payment-element), [Google Identity Services](https://developers.google.com/identity/gsi/web/reference/js-reference), [Sign in with Apple JS](https://developer.apple.com/documentation/signinwithapplejs).
