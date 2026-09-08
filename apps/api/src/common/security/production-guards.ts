import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const UNSAFE_JWT_SECRETS = new Set([
  "",
  "dev-secret",
  "secret",
  "changeme",
  "jwt-secret",
  "test-secret",
  "qa-full-lifecycle-secret",
]);

/**
 * Fail fast in production when secrets/CORS are misconfigured (SEC-002).
 */
export function assertProductionSecurity(config: ConfigService): void {
  const isProd = config.get<string>("NODE_ENV") === "production";
  if (!isProd) return;

  const logger = new Logger("SecurityBootstrap");
  const jwt = config.get<string>("JWT_SECRET") || "";
  if (UNSAFE_JWT_SECRETS.has(jwt) || jwt.length < 32) {
    throw new Error(
      "Production startup refused: JWT_SECRET must be set to a strong value (32+ chars), not a default.",
    );
  }

  const cors = config.get<string>("CORS_ORIGINS") || "";
  if (!cors.trim()) {
    throw new Error(
      "Production startup refused: CORS_ORIGINS must be a comma-separated allowlist.",
    );
  }

  for (const key of [
    "MONGODB_URI",
    "REDIS_URL",
    "S3_BUCKET",
    "SERVICE_AREA_LATITUDE",
    "SERVICE_AREA_LONGITUDE",
    "SERVICE_AREA_RADIUS_METERS",
  ]) {
    if (!config.get<string>(key)?.trim())
      throw new Error(`Production startup refused: ${key} is required.`);
  }
  if (cors.split(",").some((origin) => origin.trim() === "*"))
    throw new Error("Production CORS cannot contain a wildcard.");
  if (
    config.get<string>("STRIPE_SECRET_KEY") &&
    !config.get<string>("STRIPE_WEBHOOK_SECRET")
  )
    throw new Error("Stripe requires a signed webhook in production.");
  const radius = Number(config.get("SERVICE_AREA_RADIUS_METERS"));
  const lat = Number(config.get("SERVICE_AREA_LATITUDE"));
  const lng = Number(config.get("SERVICE_AREA_LONGITUDE"));
  if (
    !Number.isFinite(radius) ||
    radius <= 0 ||
    !Number.isFinite(lat) ||
    Math.abs(lat) > 90 ||
    !Number.isFinite(lng) ||
    Math.abs(lng) > 180
  )
    throw new Error("Invalid service area configuration.");

  if (config.get<string>("OTP_DEV_BYPASS") === "true") {
    logger.warn("OTP_DEV_BYPASS is ignored in production (forced off).");
  }

  if (config.get<string>("SWAGGER_ENABLED") === "true") {
    logger.warn("Swagger is enabled in production — ensure it is not public.");
  }
}

export function parseCorsOrigins(config: ConfigService): boolean | string[] {
  const isProd = config.get<string>("NODE_ENV") === "production";
  const raw = config.get<string>("CORS_ORIGINS");
  if (raw && raw.trim()) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // Dev convenience: reflect any origin. Production must set CORS_ORIGINS.
  return isProd ? [] : true;
}

export function isOtpDevBypassEnabled(config: ConfigService): boolean {
  if (config.get<string>("NODE_ENV") === "production") return false;
  return config.get<string>("OTP_DEV_BYPASS") === "true";
}
