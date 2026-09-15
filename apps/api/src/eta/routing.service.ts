import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
@Injectable()
export class RoutingService {
  private cache = new Map<
    string,
    { expires: number; minutes: number | null }
  >();
  constructor(private config: ConfigService) {}
  async minutes(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ): Promise<number | null> {
    const apiKey = this.config.get<string>("GEOAPIFY_API_KEY");
    if (!apiKey || this.config.get("ROUTING_ENABLED") !== "true") return null;
    if (
      ![from.latitude, from.longitude, to.latitude, to.longitude].every(
        Number.isFinite,
      ) ||
      Math.abs(from.latitude) > 90 ||
      Math.abs(to.latitude) > 90 ||
      Math.abs(from.longitude) > 180 ||
      Math.abs(to.longitude) > 180
    )
      return null;
    const key = `${from.latitude},${from.longitude}|${to.latitude},${to.longitude}`;
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.minutes;
    let minutes: number | null = null;
    try {
      const url = new URL("https://api.geoapify.com/v1/routing");
      url.search = new URLSearchParams({
        waypoints: key,
        mode: "drive",
        traffic: "approximated",
        apiKey,
      }).toString();
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const data = (await response.json()) as {
          features?: { properties?: { time?: number } }[];
        };
        const seconds = data.features?.[0]?.properties?.time;
        if (
          typeof seconds === "number" &&
          Number.isFinite(seconds) &&
          seconds >= 0 &&
          seconds < 21600
        )
          minutes = Math.ceil(seconds / 60);
      }
    } catch {
      /* Keep ordering available when routing cannot answer. */
    }
    if (this.cache.size >= 500)
      this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(key, {
      expires: Date.now() + (minutes === null ? 30000 : 300000),
      minutes,
    });
    return minutes;
  }
}
