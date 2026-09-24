import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { CatalogService } from "./catalog.service";
import { MenuManagementService } from "./menu-management.service";
import {
  CatalogListDto,
  CreateMenuDto,
  UpdateMenuDto,
  ActiveStatusDto,
} from "./dto/management.dto";
import { CreateMenuVersionDto } from "./dto/catalog.dto";
@ApiTags("menus")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("menus")
export class MenusController {
  constructor(
    private readonly menus: MenuManagementService,
    private readonly catalog: CatalogService,
  ) {}
  @Get() list(@Query() query: CatalogListDto) {
    return this.menus.list(query);
  }
  @Post() create(@Body() dto: CreateMenuDto) {
    return this.menus.create(dto);
  }
  @Get(":id") get(@Param("id") id: string) {
    return this.menus.get(id);
  }
  @Patch(":id") update(@Param("id") id: string, @Body() dto: UpdateMenuDto) {
    return this.menus.update(id, dto);
  }
  @Patch(":id/status") status(
    @Param("id") id: string,
    @Body() dto: ActiveStatusDto,
  ) {
    return this.menus.update(id, dto);
  }
  @Delete(":id") remove(@Param("id") id: string) {
    return this.menus.remove(id);
  }
  @Get(":id/versions") versions(@Param("id") id: string) {
    return this.menus.listVersions(id);
  }
  @Post(":id/versions") createVersion(
    @Param("id") id: string,
    @Body() dto: CreateMenuVersionDto,
  ) {
    return this.catalog.createVersion({ ...dto, menuId: id });
  }
}
