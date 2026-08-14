# Yespizz — Website

Workspace: `apps/website` · http://localhost:8050

Marketing site. It should sell the product promise — a standard order at a stated time, without choosing a restaurant — not a restaurant marketplace and not claims the apps cannot keep.

Product: [`docs/PRODUCT.md`](../../docs/PRODUCT.md) · strategy: [`prd/product-strategy.md`](../../prd/product-strategy.md).

## Role

- Explain blind fulfillment: one brand menu, assigned kitchen, stated time window.
- Send people to the customer app.
- Do not advertise loyalty, live in-app map, 35-minute guarantees, Apple Pay, scheduled delivery, or chat support until those are shipped.

## Shipped

| Path | Purpose |
|---|---|
| `/` | Production landing (`src/content/landing.ts`) |
| `/dev` | Archived landing experiments index |
| `/dev/yesplz` | Archived Yesplz experimental landing |

SEO: `robots`, `sitemap`, JSON-LD. Store links: `src/content/app-links.ts` (local default `http://localhost:8051`).

Current landing copy still reads like a single Vienna kitchen and lists features that are not in the apps (loyalty, one-tap reorder, live map, 35-min ETA, Apple Pay, scheduled delivery, chat). Treat that as a copy gap against the PRD, not as product truth.

## Development

From the monorepo root:

```sh
npm run dev:website
```

Content: `src/content/landing.ts`, `src/content/app-links.ts`, `src/content/images.ts`.

```sh
npm run lint --workspace=website
npm run check-types --workspace=website
npm run build --workspace=website
```
