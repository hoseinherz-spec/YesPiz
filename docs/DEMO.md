# Local demo

Run `npm run demo` from the repository root. A locally installed MongoDB binary can be selected with `MONGOMS_SYSTEM_BINARY=/opt/homebrew/bin/mongod npm run demo`; otherwise the memory-server package uses its configured MongoDB binary.

The launcher starts an isolated disposable database, seeds the catalog and coupons, builds twelve orders through the business API (including one cancelled and one unpaid order) and opens four independent development services. Logs and order IDs are written under `.qa/demo/`. Stop with Ctrl+C. Restart resets the demo; existing developer and production data are unaffected.

| App | URL | Email | Password |
|---|---|---|---|
| Customer | http://localhost:8251 | customer@yespizz.local | Customer123! |
| Admin | http://localhost:8252 | admin@yespizz.local | Admin123! |
| Kitchen | http://localhost:8284 | provider.munich@yespizz.local | Provider123! |
| Courier | http://localhost:8253 | courier@yespizz.local | Courier123! |

Additional on-duty couriers are `courier.car@yespizz.local` and `courier.motorcycle@yespizz.local`, both with `Courier123!`. They can be selected in the kitchen handoff list.

These credentials belong exclusively to the disposable local demo.

## Walkthrough

1. Customer: browse/search the live catalog, open Rewards and inspect the five completed paid orders. Claim the earned loyalty credit through the normal reward action.
2. Copy PIZZA10 (10%, minimum €15, maximum discount €5), NIGHT5 (€5 off, minimum €30), or TOGETHER15 (15%, minimum €45, maximum discount €10). Apply a code at checkout and inspect the server total with no delivery fee.
3. Orders include unpaid, cancelled, searching, preparing, ready, assigned and on-the-way states. Open a preparing order to try the optional matching game. Disable it in Settings and revisit tracking.
4. Kitchen: inspect the board and filters, adjust preparation time, complete quality checks and seal before marking ready. Find ready orders, create a pickup group and assign an on-duty courier.
5. Courier: inspect the scooter profile; change to a car or motorcycle, save it and revisit customer tracking. Use the private kitchen chat for pickup coordination.
6. Complete pickup with the kitchen's generated code and seal, then delivery with the customer's PIN and correct location. For cash orders, record the exact order total before completing.
7. Admin: review the actual orders/counts, customer support and operational screens, edit catalog images/tags and coupon campaigns. Customer sections reflect managed data.

A searching request continues through the normal timeout/retry rules if no kitchen responds. Location snapshots created during setup become stale naturally; live tracking requires the courier to share a fresh location. Card payment in this isolated demo is simulated; no money is charged. Kitchen photos/catalog assets are demo media, while records, prices, discounts and order transitions come from the API.
