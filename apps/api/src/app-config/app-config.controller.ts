import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AppConfigService } from "./app-config.service";
import { UpdateAppConfigDto } from "./dto/app-config.dto";
import type { AppConfigDocument } from "./schemas/app-config.schema";

@ApiTags("app-config")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("app-config")
export class AppConfigController {
  constructor(private readonly appConfig: AppConfigService) {}

  @Get()
  async get() {
    const doc = await this.appConfig.get();
    return this.toPublic(doc);
  }

  @Patch()
  async update(@Body() dto: UpdateAppConfigDto) {
    const doc = await this.appConfig.update(dto);
    return this.toPublic(doc);
  }

  private toPublic(doc: AppConfigDocument) {
    return {
      id: doc.id ?? String(doc._id),
      key: doc.key,
      w1Rating: doc.w1Rating,
      w2Proximity: doc.w2Proximity,
      w3QueueEmptiness: doc.w3QueueEmptiness,
      w4Fairness: doc.w4Fairness,
      w5Quality: doc.w5Quality,
      dispatchTopN: doc.dispatchTopN,
      waveSize: doc.waveSize,
      bidWindowSeconds: doc.bidWindowSeconds,
      dispatchInitialRadiusMeters: doc.dispatchInitialRadiusMeters,
      dispatchExpandedRadiusMeters: doc.dispatchExpandedRadiusMeters,
      offerTimeoutSeconds: doc.offerTimeoutSeconds,
      cashFailThreshold: doc.cashFailThreshold,
      cashHardCapCents: doc.cashHardCapCents,
      qualityAutoSuspendThreshold: doc.qualityAutoSuspendThreshold,
      maxBatchSize: doc.maxBatchSize,
      maxBatchHoldMinutes: doc.maxBatchHoldMinutes,
      maxBagMinutes: doc.maxBagMinutes,
      pickupGeoRadiusMeters: doc.pickupGeoRadiusMeters,
      dropoffGeoRadiusMeters: doc.dropoffGeoRadiusMeters,
      etaBasePrepMinutes: doc.etaBasePrepMinutes,
      etaBaseDeliveryMinutes: doc.etaBaseDeliveryMinutes,
      etaWindowPaddingMinutes: doc.etaWindowPaddingMinutes,
    };
  }
}
