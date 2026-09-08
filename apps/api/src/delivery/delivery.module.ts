import {
  BadRequestException,
  Controller,
  Get,
  Module,
  Query,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppConfigService } from "../app-config/app-config.service";
import { pricingOptions } from "../orders/pricing";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { Throttle } from "@nestjs/throttler";
@Controller("delivery")
class DeliveryController {
  constructor(
    private readonly config: ConfigService,
    private readonly appConfig: AppConfigService,
  ) {}
  @Get("options") async options() {
    return pricingOptions(await this.appConfig.get());
  }
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get("search")
  async search(@Query("q") text: string) {
    if (typeof text !== "string" || text.trim().length < 3 || text.length > 200)
      throw new BadRequestException("Enter an address.");
    const key = this.config.get<string>("GEOAPIFY_API_KEY");
    if (!key)
      throw new ServiceUnavailableException(
        "Address search is unavailable. Select your location on the map.",
      );
    const url = new URL("https://api.geoapify.com/v1/geocode/search");
    url.search = new URLSearchParams({
      text,
      apiKey: key,
      format: "json",
      limit: "5",
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok)
      throw new ServiceUnavailableException(
        "Address search failed. Please retry.",
      );
    const data = (await response.json()) as {
      results?: Array<{
        formatted: string;
        street?: string;
        housenumber?: string;
        city?: string;
        postcode?: string;
        lat: number;
        lon: number;
      }>;
    };
    return (data.results ?? []).map((row) => ({
      label: row.formatted,
      street: [row.street, row.housenumber].filter(Boolean).join(" "),
      city: row.city ?? "",
      zipcode: row.postcode ?? "",
      latitude: row.lat,
      longitude: row.lon,
    }));
  }
}
@Module({ controllers: [DeliveryController] })
export class DeliveryModule {}
