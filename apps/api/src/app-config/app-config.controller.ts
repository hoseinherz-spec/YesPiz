import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AppConfigService } from "./app-config.service";
import { UpdateAppConfigDto } from "./dto/app-config.dto";

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

  private toPublic(doc: {
    id?: string;
    _id?: { toString(): string };
    key: string;
    w1Rating: number;
    w2Proximity: number;
    w3QueueEmptiness: number;
    dispatchTopN: number;
    dispatchInitialRadiusMeters: number;
    dispatchExpandedRadiusMeters: number;
    offerTimeoutSeconds: number;
    cashFailThreshold: number;
    maxBatchSize: number;
  }) {
    return {
      id: doc.id ?? String(doc._id),
      key: doc.key,
      w1Rating: doc.w1Rating,
      w2Proximity: doc.w2Proximity,
      w3QueueEmptiness: doc.w3QueueEmptiness,
      dispatchTopN: doc.dispatchTopN,
      dispatchInitialRadiusMeters: doc.dispatchInitialRadiusMeters,
      dispatchExpandedRadiusMeters: doc.dispatchExpandedRadiusMeters,
      offerTimeoutSeconds: doc.offerTimeoutSeconds,
      cashFailThreshold: doc.cashFailThreshold,
      maxBatchSize: doc.maxBatchSize,
    };
  }
}
