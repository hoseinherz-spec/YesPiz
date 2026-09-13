# Yespizz

Yespizz is an npm workspaces and Turborepo monorepo for a blind-marketplace pizza delivery product.

The menu is not the advantage. The promise is a **standard, reliable order at a stated time**, without the customer choosing a restaurant. Features should strengthen quality, success-probability assignment, and error-free operations. See [`docs/PRODUCT.md`](docs/PRODUCT.md).

## Apps

| App | Workspace | Development URL |
| --- | --- | --- |
| Website | `apps/website` | http://localhost:8050 |
| Mobile | `apps/mobile` | http://localhost:8051 |
| Admin | `apps/admin` | http://localhost:8052 |
| Courier mobile | `apps/courier-mobile` | http://localhost:8053 |
| Provider panel | `apps/provider-panel` | http://localhost:8084 |
| API | `apps/api` | http://localhost:8058 |

## Product & architecture docs

- [Product brief](docs/PRODUCT.md)
- [Product strategy (PRD)](prd/product-strategy.md)
- [Order flow and role connections](docs/ORDER-FLOW.md)
- [Role workflow review and real-world requirements](docs/ROLE-WORKFLOW-REVIEW.md)
- [Release readiness and external service setup](docs/RELEASE-READINESS.md)
- [Stripe sandbox acceptance](docs/STRIPE-SANDBOX.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Data models](docs/DATA-MODELS.md)
- [Services & rollout](docs/SERVICES.md)
- [Implementation backlog for Cursor](docs/IMPLEMENTATION-BACKLOG.md)

API Swagger UI: http://localhost:8058/api/docs

## Development

Install all workspace dependencies from the repository root:

```sh
npm install
```

Configure the API (see `apps/api/.env.example`), then seed demo data:

```sh
cp apps/api/.env.example apps/api/.env
npm run seed --workspace=api
```

Run every app together:

```sh
npm run dev
```

Run one app:

```sh
npm run dev:website
npm run dev:mobile
npm run dev:admin
npm run dev:courier
npm run dev:provider
npm run dev:api
```

## Validation

```sh
npm run build
npm run lint
npm run check-types
npm run test
```
