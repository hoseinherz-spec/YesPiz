# Orders page visual QA

Source: /var/folders/hs/p9n84bgx2656zl_bypcg319c0000gn/T/codex-clipboard-1801b070-e1f2-4f8e-80da-385d08e8cd52.png (3360 × 1862, four framed phone screens).
Updated brief: browser comments requesting a newly designed empty illustration and the main logo everywhere in the customer app.
Implementation: http://localhost:8051/orders/
Captures: /tmp/orders-empty-final.png and /tmp/orders-completed.png, 393 × 852 CSS/pixel viewport. Also inspected at 1280 × 720 with the existing centered app shell. Source app-owned content compared proportionally, excluding device status bars, notches and bezels.

## Visual comparison
Source and implementation captures opened together. Compared full composition and readable card/header details.
- Typography: existing Poppins retained; 16px card names, 14px metadata and 20px empty heading. Long names truncate.
- Layout: rounded segment selector, 12px card inset, square product images, paired pill actions, compact cancelled cards and fixed existing bottom navigation follow the reference structure.
- Colors: existing navy theme retained per the current app; lime selection and purple prices/actions. Completed badge contrast improved for dark mode.
- Images: shared original logo paths used, with a light wordmark variant for dark backgrounds. New generated pizza-box empty illustration replaces the old photographic composition. Existing product imagery used as the unavailable-thumbnail fallback.
- Copy: real item counts and dates replace fictional distance; EUR retains the app currency. Actual fulfillment state replaces a potentially false Paid badge. Empty copy varies by tab.

## Comparison history
1. Existing text logo and photographic empty state replaced as requested.
2. Missing product thumbnails rendered shopping-bag placeholders; added existing pizza imagery fallback and recaptured completed cards.
3. Signed-out sample history discovered while checking cards; excluded it from the orders page. All three signed-out tab states rechecked.
4. Completed badge color adjusted for dark-background contrast.

## Verification
All three tab selections and corresponding empty messages verified in the in-app browser. Completed and cancelled card layouts inspected using the app's pre-existing sample history before the signed-out-data correction. Final empty state has no overflow at 393 × 852. Browser error log was empty. TypeScript check passed.

## Remaining test coverage
No authenticated active order was available. The active progress card, cancellation API, reorder API and review submission were not exercised end to end. These retain the existing API paths and confirmation sheets; full active-state visual QA remains blocked by absent authenticated order data. Light-mode artwork presentation and all shared-logo consumer routes were not browser-verified.

final result: blocked
