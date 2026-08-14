# Yespizz Website

Marketing landing for Yespizz (`apps/website`).

## Development

From the monorepo root:

```sh
npm run dev:website
```

Open [http://localhost:8050](http://localhost:8050).

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Production landing |
| `/dev` | Archived landing experiments index |
| `/dev/yesplz` | Archived Yesplz experimental landing |

## Content

- Product copy: `src/content/landing.ts`
- App / store links: `src/content/app-links.ts` (defaults to mobile on `http://localhost:8051`)
- Images: `src/content/images.ts`

## Validation

```sh
npm run lint --workspace=website
npm run check-types --workspace=website
npm run build --workspace=website
```
