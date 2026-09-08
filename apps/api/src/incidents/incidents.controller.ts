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
import { CreateIncidentDto, ResolveIncidentDto } from "./dto/incident.dto";
import { IncidentsService } from "./incidents.service";

@ApiTags("incidents")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("incidents")
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}

  @Roles(UserRole.COURIER)
  @Post("orders/:orderId")
  report(
    @CurrentUser() user: JwtPayloadUser,
    @Param("orderId") orderId: string,
    @Body() dto: CreateIncidentDto,
  ) {
    return this.incidents.report(user.userId, orderId, dto);
  }

  @Roles(UserRole.COURIER)
  @Get("me")
  myIncidents(@CurrentUser() user: JwtPayloadUser) {
    return this.incidents.listForCourier(user.userId);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  listOpen() {
    return this.incidents.listOpen();
  }

  @Roles(UserRole.ADMIN, UserRole.COURIER)
  @Get(":id")
  get(@CurrentUser() user: JwtPayloadUser, @Param("id") id: string) {
    return this.incidents.get(
      id,
      user.roles.includes(UserRole.ADMIN) ? undefined : user.userId,
    );
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id/resolve")
  resolve(@Param("id") id: string, @Body() dto: ResolveIncidentDto) {
    return this.incidents.resolve(id, dto);
  }
}
