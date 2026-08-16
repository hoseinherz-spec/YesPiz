# Platform runbooks (PLATFORM-001 / PLATFORM-002)

## Validation (PLATFORM-001)

From repo root:

```sh
npm ci
npm run lint
npm run check-types
npm run test
npm run build
```

API E2E (requires Jest e2e config):

```sh
npm run test:e2e --workspace=api
```

CI should gate merges on lint, types, unit, e2e, and build. Prefer split jobs for clearer failures.

Critical backend coverage: account (auth/invites), dispatch (wave), quality gates, proof chain, payments, incidents.

## Deployment & recovery (PLATFORM-002)

### Staging sketch

| Component | Notes |
|-----------|--------|
| API | NestJS on Node 20+, `NODE_ENV=production`, strong `JWT_SECRET`, `CORS_ORIGINS`, MongoDB, optional Redis |
| Web apps | Next static/SSR behind TLS; `NEXT_PUBLIC_API_URL` |
| Object storage | Configure durable uploads for proof media (local `uploads/` is demo-only) |
| Mobile | Capacitor builds; store channels + privacy permission copy |

### Health

- `GET /api/v1/health` (or app controller health) for liveness
- Graceful shutdown: stop accepting traffic, drain Socket.IO, close Mongo

### Observability

- Structured JSON logs (Nest logger + `AuditService` security events)
- Correlate with `orderId` / user id in payment, dispatch, incident paths
- Alert on payment capture failures, wave resolve failures, open SOS incidents

### Backup / rollback

- Daily Mongo dump + restore drill documented per environment
- App rollback: redeploy previous image/tag; avoid destructive migrations without backup

### Seeds vs production

- `npm run seed --workspace=api` is **dev/demo only**
- Production never depends on demo seed users or Munich demo coords as live data

### Mobile store checklist

- Android/iOS signing keys in secure storage
- Privacy: location, camera (proof), notifications
- Release channels: internal → closed → production
- Hide call/chat until masked-comms provider is configured

See also [`DEMO.md`](DEMO.md) for local click-through.
