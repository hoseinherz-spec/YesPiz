import {
  Body,
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
  create(@Body() dto: CreateBatchDto) {
    return this.batches.create(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Post("suggest")
  suggest(@Body() dto: SuggestBatchDto) {
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
  assign(@Param("id") id: string, @Body() dto: AssignCourierDto) {
    return this.batches.assignCourier(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.PROVIDER, UserRole.COURIER)
  @Get(":id")
  get(@Param("id") id: string) {
    return this.batches.get(id);
  }
}
