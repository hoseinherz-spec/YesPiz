# IP deployment on the shared VPS

SSH alias: `gym4me-vps`. Remote directory: `/opt/yespizz`.
The independent Compose project is `yespizz`; Club4me is not modified.

| Service | URL |
| --- | --- |
| Website | http://185.105.239.140:8050 |
| Customer | http://185.105.239.140:8051 |
| Admin | http://185.105.239.140:8052 |
| Courier | http://185.105.239.140:8053 |
| Kitchen | http://185.105.239.140:8084 |
| API | http://185.105.239.140:8058 |

MongoDB and Redis are only accessible on the private Docker network. MinIO's
S3 endpoint uses port 8059; its console is not published. Persistent volumes
belong exclusively to Yespizz. Runtime containers have memory limits.

Build sequentially from the remote source directory:

```sh
docker build --network=host --build-arg PUBLIC_API_URL=http://185.105.239.140:8058 --target runtime -f deploy/vps/Dockerfile -t yespizz-runtime:latest .
docker build --network=host --build-arg PUBLIC_API_URL=http://185.105.239.140:8058 --target gateway -f deploy/vps/Dockerfile -t yespizz-gateway:latest .
docker build --network=host -f deploy/vps/Dockerfile.website -t yespizz-website:latest .
docker tag yespizz-runtime:latest yespizz-admin:latest
cd deploy/vps
docker compose up -d
docker compose ps
```

For an API-only update, rebuild `apps/api`, stage its `dist` directory as
`api-runtime-dist`, then build with `Dockerfile.api-runtime` as `yespizz-api`.
The API service uses that separate image so `docker compose up -d --no-deps
--force-recreate api` replaces only the backend container. Other services keep
using `yespizz-runtime`.

Secrets are generated on the server and stored in `deploy/vps/.env` (mode 600).
Do not overwrite that file on updates. Admin account creation is pending explicit approval.
No demo accounts with default passwords are seeded.

The S3 public endpoint is reachable externally. Access from the API through the
public IP requires a narrowly scoped forwarding rule; this change is pending
approval. Direct storage write/read/delete on the private network is verified.

This deployment uses HTTP. Secure-context features such as browser location,
push notifications, and some sign-in integrations need HTTPS. Payments,
SMS, and social authentication require their own service credentials.
The initial service area follows the project's Munich sample coordinates;
configure the actual area before taking orders.

Catalog enrichment (2026-09-26): published v3 with ten pizzas, six pizza
attributes each, 34 library ingredients, measured recipes and priced topping
options. Database backup: `/opt/yespizz/backups/catalog-before-enrichment-20260926.archive.gz`.
Customer and admin were rebuilt with `NEXT_PUBLIC_API_URL=http://185.105.239.140:8058`.
The admin now uses `yespizz-admin:latest`; the customer gateway has current
static detail/combo routes. For prebuilt frontend updates use
`Dockerfile.frontend-update`, staging production `.next` (excluding cache/dev)
as `frontend-runtime/admin/next-build`, admin public assets as
`frontend-runtime/admin/public`, and mobile `out` as `frontend-runtime/customer`.
Build its admin and gateway targets, then recreate only admin and gateway.
The validated enrichment script is `scripts/enrich-vps-catalog.cjs`; it uses
the compiled Nest catalog services inside the API container and skips already
enriched menus.

Menu completion (2026-09-26): v4 has three independently priced variants and
measured recipes per pizza, optional thick dough (+100 cents), mozzarella
stuffed crust (+200 cents), and side sauces (+80/100 cents). Small/medium/large
use 24/30/36 cm sample sizes, with base prices -200/+0/+300 cents relative to
the prior medium price. Standard pizzas cook for 480 seconds, premium pizzas
for 600 seconds. Gallery URLs and a neutral customization base are configured;
combo ingredients, allergens, measured portions and medium variant references
are derived from their components. These remain sample kitchen data.
`complete-vps-menu.cjs` uses validated services and skips already-completed menus.
Backup: `/opt/yespizz/backups/menu-before-completion-20260926.archive.gz`.
Verification: 120 recipe/choice combinations and 90 real checkout pricing
scenarios passed, plus 30 existing catalog/pricing/recipe tests.

User preference update: reconstruction is disabled. Pizza photos stay unchanged
when toppings change. All topping controls start unselected and represent only
requested deltas (remove included / add extra). Dough, crust and side-sauce
option groups were removed; independent sizes, recipes, galleries, cooking times
and complete combo data remain. `simplify-vps-customization.cjs` applies this
preference. The completion script skips already configured variant menus.

Correction to the user preference: keep optional side sauces, while leaving
reconstruction disabled and topping deltas initially unselected. Crispiness
attributes were retained throughout and are now displayed on pizza details.
`restore-vps-sauces.cjs` restores the sauce group. Combo detail now opens the
cart immediately after adding, matching the bundles page behavior.

### Temporary mock email delivery
VPS test mode: AUTH_EMAIL_PROVIDER=mock, AUTH_EMAIL_MOCK_ENABLED=true,
AUTH_EMAIL_MOCK_DOMAINS=yespizz.local. Only allowed demo domains receive a
verificationCode in signup/reset responses; the app already autofills it.
All code expiry, attempt limits, password hashing and one-time tokens remain.
Other emails use the preserved Resend implementation and require its existing
RESEND_API_KEY/AUTH_EMAIL_FROM configuration. To restore real delivery everywhere,
set AUTH_EMAIL_PROVIDER=resend and AUTH_EMAIL_MOCK_ENABLED=false, then recreate
only the API service. Do not change NODE_ENV or disable authentication.
