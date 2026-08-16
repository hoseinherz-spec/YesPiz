import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { SlaService } from "./sla.service";

@ApiTags("sla")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("sla")
export class SlaController {
  constructor(private readonly sla: SlaService) {}

  @Roles(UserRole.ADMIN)
  @Get("compensations")
  listCompensations() {
    return this.sla.listCompensated();
  }
}
