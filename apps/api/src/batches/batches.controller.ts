import {
  Body,
  ForbiddenException,
  NotFoundException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { ProvidersService } from "../providers/providers.service";
import { BatchesService } from "./batches.service";
import {
  AssignCourierDto,
  CreateBatchDto,
  ReduceBatchDto,
  SuggestBatchDto,
} from "./dto/batch.dto";

@ApiTags("batches")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("batches")
export class BatchesController {
  constructor(
    private readonly batches: BatchesService,
    private readonly providers: ProvidersService,
  ) {}

  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Post()
  async create(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: CreateBatchDto,
  ) {
    await this.assertProvider(user, dto.providerId);
    return this.batches.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Post("suggest")
  async suggest(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: SuggestBatchDto,
  ) {
    await this.assertProvider(user, dto.providerId);
    return this.batches.suggest(dto.providerId);
  }

  @Roles(UserRole.PROVIDER)
  @Get("provider")
  async listProvider(@CurrentUser() user: JwtPayloadUser) {
    const provider = await this.providers.getSelf(user.userId);
    return this.batches.listForProvider(provider.id);
  }

  @Roles(UserRole.COURIER)
  @Get("assigned")
  listAssigned(@CurrentUser() user: JwtPayloadUser) {
    return this.batches.listForCourier(user.userId);
  }

  @Roles(UserRole.PROVIDER)
  @Patch(":id/reduce")
  async reduce(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: ReduceBatchDto,
  ) {
    const provider = await this.providers.getSelf(user.userId);
    return this.batches.reduce(id, provider.id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Post(":id/assign-courier")
  async assign(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: AssignCourierDto,
  ) {
    const batch = await this.batches.get(id);
    if (!batch) throw new NotFoundException("errors.notFound");
    await this.assertProvider(user, String(batch.providerId));
    return this.batches.assignCourier(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.PROVIDER, UserRole.COURIER)
  @Get(":id")
  async get(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    const batch = await this.batches.get(id);
    if (!batch) throw new NotFoundException("errors.notFound");
    if (user.activeRole === UserRole.COURIER) {
      if (String(batch.courierId) !== user.userId)
        throw new ForbiddenException("errors.forbidden");
    } else {
      await this.assertProvider(user, String(batch.providerId));
    }
    return batch;
  }

  private async assertProvider(user: JwtPayloadUser, providerId: string) {
    if (user.activeRole === UserRole.ADMIN) return;
    const provider = await this.providers.getSelf(user.userId);
    if (provider.id !== providerId)
      throw new ForbiddenException("errors.forbidden");
  }
}
