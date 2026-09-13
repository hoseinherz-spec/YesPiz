FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN npm ci --no-audit --no-fund
ARG PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$PUBLIC_API_URL NEXT_TELEMETRY_DISABLED=1 NEXT_DISABLE_WEBPACK_CACHE=1 NODE_OPTIONS=--max-old-space-size=1536
ENV NEXT_PUBLIC_SERVICE_AREA_LATITUDE=48.1374 NEXT_PUBLIC_SERVICE_AREA_LONGITUDE=11.5755
RUN npm run build --workspace=@repo/i18n && npm run build --workspace=api
RUN npm exec --workspace=mobile -- next build --webpack
RUN npm exec --workspace=courier-mobile -- next build --webpack
RUN npm exec --workspace=admin -- next build --webpack
RUN npm exec --workspace=provider-panel -- next build --webpack
RUN npm exec --workspace=website -- next build --webpack
FROM build AS runtime
ENV NODE_ENV=production NODE_OPTIONS=--max-old-space-size=384
USER node
CMD ["node", "apps/api/dist/main.js"]
FROM yespizz-runtime:latest AS compiled
FROM nginx:1.28-alpine AS gateway
COPY --from=compiled /app/apps/mobile/out /srv/customer
COPY --from=compiled /app/apps/courier-mobile/out /srv/courier
COPY deploy/vps/nginx.conf /etc/nginx/conf.d/default.conf
