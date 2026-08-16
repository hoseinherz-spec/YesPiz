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

  if (config.get<string>("OTP_DEV_BYPASS") === "true") {
    logger.warn(
      "OTP_DEV_BYPASS is ignored in production (forced off).",
    );
  }

  if (config.get<string>("SWAGGER_ENABLED") === "true") {
    logger.warn("Swagger is enabled in production — ensure it is not public.");
  }
}

export function parseCorsOrigins(config: ConfigService): boolean | string[] {
  const isProd = config.get<string>("NODE_ENV") === "production";
  const raw = config.get<string>("CORS_ORIGINS");
  if (raw && raw.trim()) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  // Dev convenience: reflect any origin. Production must set CORS_ORIGINS.
  return isProd ? [] : true;
}

export function isOtpDevBypassEnabled(config: ConfigService): boolean {
  if (config.get<string>("NODE_ENV") === "production") return false;
  return config.get<string>("OTP_DEV_BYPASS") === "true";
}
