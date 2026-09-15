# Yespiz reference refresh — design QA

final result: passed

Date: 2026-09-15. Scope: reference-inspired customer-app refresh, not a pixel-identical clone. API/payment implementations unchanged; payment remains mock.

## Sources and comparison method

Reviewed the 40 user-provided screenshots and all four files in `/Users/mahdi/Downloads/Yespiz/Orders/`. Source screens are mostly 390 pixels wide and include device chrome; app captures exclude status bar/notch. Compared source and implementation images together in tool image inputs for completed orders, address lists and Help Center. Source uses placeholder data; implementation uses current local API data. FAQ source and captured search state differ in visible question count, so comparison evaluates the shared search/accordion/selection structure rather than exact content geometry.

Existing Poppins, app routes, animation components, product assets and UI icons reused. No source placeholder prices, discounts, reviews, social-provider connection claims or example contacts copied into working product data.

## Implemented

- Purple actions and prices (#790bea), lime selections (#d1ff00), pale green fields and secondary controls, white light surfaces and navy dark surfaces. Focus and dark secondary copy remain readable.
- Shared screen/header/action-bar scale, rounded cards, soft shadows and dark floating navigation with lime selected state.
- Home: brand/notification header, delivery context, search, category tiles with meaningful icons, feature shortcuts, featured pizza and horizontal discovery cards.
- Orders: independent active/completed/cancelled views, compact cards with menu imagery, actual totals/status/date, retained feedback/support/reorder/tracking actions.
- Reorder and cancellation use a reusable accessible HeroUI drawer. Profile logout now has a confirmation drawer.
- Profile: compact identity and icon rows; direct saved-address entry.
- Saved-address page: real account addresses, current selection and working add-address navigation. Address form returns to this list when opened from it.
- Help: searchable FAQ and a Contact us tab retaining the live order-support form and request history. Order-specific links open the contact tab.
- Notification settings grouped in an expandable section; activity uses simpler separated rows.
- Existing checkout, saved items, form pages and newly added product features inherit the shared palette/control improvements.

## QA iterations and corrections

1. Initial visual review found pale backgrounds on inactive order tabs and a nonmatching wordmark asset. Applied explicit semantic segment colors and a legible text brand header.
2. Order cards had oversized empty thumbnail regions and inconsistent price color. Switched to a compact layout, catalog-backed image fallback, clearer action row and purple price. Captured `orders-completed.png` after correction.
3. Drawer height/background was incorrectly applied to its fullscreen container. Moved sheet styling to the dialog, corrected header direction and button sizing. Confirmed opening and cancelling logout preserves login; reorder drawer loads current menu prices.
4. 320-pixel dark review found subdued secondary text. Updated dark muted/placeholder tokens and captured `home-dark-320.png` after correction.

## Verification

- `npm run lint --workspace=mobile`: passed, no warnings.
- `npm run check-types --workspace=mobile`: passed.
- `NEXT_DISABLE_WEBPACK_CACHE=1 NEXT_PUBLIC_API_URL=http://localhost:8158 npm run build --workspace=mobile -- --webpack`: passed, 38 static pages.
- Browser checked: home navigation, completed-order filtering, reorder review, profile, logout open/cancel, addresses, FAQ search and expansion, Contact us form, light/dark switch.
- Home at 320px: `document.documentElement.scrollWidth === innerWidth === 320`; no page-level horizontal overflow. Intentional category/product rails scroll independently.
- No real payments, external messages, deployment or production account changes performed.
- Browser hit an obsolete chunk during a live rebuild; navigation with a fresh document URL resolved it. No runtime failure observed on the final loaded screens.

## Evidence

Screenshots: `/Users/mahdi/Documents/ChatGPT/Yespiz 3/design-research/reference-refresh/`:
`orders-completed.png`, `home.png`, `home-dark-320.png`, `profile.png`, `logout-sheet.png`, `addresses.png`, `help-search.png`.

## Deliberate differences / limits

References were used for layout and visual hierarchy. Real order identifiers, timestamps, support links and cart shortcut are retained. No fake 30% campaign, restaurant rating, connected PayPal/Apple Pay, biometric authentication, chat media upload or contact-book integration was added merely because it appears in an inspiration screenshot. Text brand used because the existing raster wordmark has inconsistent lettering. No P0/P1/P2 visual issue remains in the reviewed views. Other preexisting routes inherit tokens but were not each tested in every state.
