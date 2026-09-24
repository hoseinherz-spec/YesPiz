# Native Stripe adapter

Android and iOS sources are copied without changes from the npm release
`@capacitor-community/stripe@8.2.1` (MIT), maintained at
https://github.com/capacitor-community/stripe.

The Swift package/library name is changed to `RepoNativeStripe` to match
Capacitor's product name derived from this workspace package; native source
targets remain unchanged.

The upstream package makes its optional React 17/18 wrapper and Stripe.js 8 web
implementation mandatory peer dependencies. This React 19 app only needs the
framework-independent native Capacitor API. This private workspace retains the
native sources and exposes a small typed bridge; it does not ship that React
wrapper or replace the app's existing Stripe Elements web flow.

Upgrade by reviewing/replacing these pinned native sources, checking the bridge
against upstream definitions, syncing Capacitor and building both platforms.
Do not silently widen upstream peer dependencies or disable npm peer checks.
