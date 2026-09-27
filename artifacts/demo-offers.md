# Demo discounts and rewards

Valid only for customer@yespizz.local and rewards.new/progress/ready@yespizz.local. These extra demo accounts use the existing demo customer's password. Coupons expire 30 days after seeding. No real customer balances or completed orders were fabricated.

| Code | Terms |
|---|---|
| DEMO10 | 10%, subtotal ≥ €10, cap €5 |
| DEMO5 | €5 off, subtotal ≥ €30 |
| DEMO-PIZZA15 | 15% on Funghi, subtotal ≥ €10, cap €10 |
| DEMO-COMBO20 | 20% on combos, subtotal ≥ €10, cap €10 |
| DEMO-PAIR | 12%, at least two eligible items, subtotal ≥ €10, cap €10 |
| DEMO-EXPIRED | Expired, rejected |
| DEMO-FUTURE | Starts tomorrow, rejected until then |
| DEMO-INACTIVE | Disabled, rejected |

Rewards use current policy (5 orders, €5 reward, minimum order €10). Server marks summaries as mock and the app displays a demo notice.
- rewards.new@yespizz.local: 0/5
- rewards.progress@yespizz.local: 4/5
- rewards.ready@yespizz.local: 5/5, one claim available
- customer@yespizz.local: 5/5, one claim available

Topping thumbnails and transparent individual pieces are held in /opt/yespizz/media/toppings, served by a read-only gateway mount at /topping-media. Ingredient models store isTopping, image and toppingImageUrl. Base ingredients (dough, base sauces, original cheeses) are not customizable; only isTopping materials are configured as options. menu options snapshot these model URLs. There is no runtime ingredient atlas/name mapping or app-bundled topping bitmap. Original source assets are archived outside the application public directory.
