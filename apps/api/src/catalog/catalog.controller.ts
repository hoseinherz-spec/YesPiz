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
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CatalogService } from "./catalog.service";
import {
  CreateCategoryDto,
  CreateMenuItemDto,
  CreateMenuVersionDto,
  UpdateMenuItemDto,
} from "./dto/catalog.dto";

@ApiTags("catalog")
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("menu")
  getPublishedMenu() {
    return this.catalog.getPublishedMenu();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("versions")
  listVersions() {
    return this.catalog.listVersions();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("versions")
  createVersion(@Body() dto: CreateMenuVersionDto) {
    return this.catalog.createVersion(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("versions/:id")
  getVersion(@Param("id") id: string) {
    return this.catalog.getVersionDetail(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("versions/:id/publish")
  publish(@Param("id") id: string) {
    return this.catalog.publish(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("versions/:id/categories")
  addCategory(@Param("id") id: string, @Body() dto: CreateCategoryDto) {
    return this.catalog.addCategory(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("versions/:id/items")
  addItem(@Param("id") id: string, @Body() dto: CreateMenuItemDto) {
    return this.catalog.addItem(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("items/:itemId")
  updateItem(@Param("itemId") itemId: string, @Body() dto: UpdateMenuItemDto) {
    return this.catalog.updateItem(itemId, dto);
  }
}
