# Applying the supplied UI references

The screenshots are visual inspiration; their social captions, sample account data, brands and unrelated features are not app requirements.

| References | YesPiz implementation |
| --- | --- |
| 3, 4, 5, 7: navigation with a separate primary action | Fixed customer navigation with a separate lime cart action, quantity badge, accessible cart total and safe-area spacing. Replaces Home's duplicate cart ribbon. |
| 3: compact shopping rows | Cart rows with readable product names, compact thumbnails, tabular totals and grouped quantity controls. Decrement is disabled at the minimum quantity. |
| 7, 15, 32: compact ongoing activity | Home shows the newest active order with its real milestones and a track/resume-payment action. Hidden when no order is active. |
| 18, 30, 31, 37: image-led shopping | Featured pizza surface with a subtle theme-colored light, circular product presentation and a separate caption/price layer. |
| 6, 8: illustrated guidance | Cart empty state reuses the shared layered illustration and a direct menu action. |

Existing theme colors, typography, real product data, reduced-motion behavior and shared transition tokens remain the foundation. No screenshot assets or sample financial figures are shipped in the app.

## Additional sections

- Profile: references 21, 22 and 41 inform the compact identity card, quick-access tiles, invitation card and grouped settings rows. Existing authentication and navigation behavior is preserved.
- Saved items: references 13, 15 and 31 inform a collection header and an accessible grid/list switch using the existing product-card variants.
- Referrals: references 1, 9 and 17 inform a ticket-style code card, dashed separators, compact real reward counts and sign-in guidance.
- Support: references 21 and 26 inform a keyboard-accessible topic radio grid and compact request status badges. Topic values, form validation and request submission stay unchanged.

Additional validation: profile navigation and the saved grid/list switch were checked in the browser. Authenticated referral and support submission flows were not exercised.

Validation: customer TypeScript and targeted lint checks pass. Browser inspection covered Home navigation and cart empty state; the floating cart action opens `/cart/`. The offline menu disables add-to-cart, so populated-cart and active-order flows were not fully exercised in this pass.
