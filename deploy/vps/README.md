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
