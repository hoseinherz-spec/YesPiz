import { MenuManagementService } from "./menu-management.service";
import {
  ActiveStatusDto,
  AddProductToMenuDto,
  CatalogListDto,
  UpdateVersionDto,
} from "./dto/management.dto";
import {
  Body,
  Delete,
  Query,
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
  UpdateCategoryDto,
  ScheduleMenuDto,
} from "./dto/catalog.dto";

@ApiTags("catalog")
@Controller("catalog")
export class CatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly management: MenuManagementService,
  ) {}

  @Get("menu")
  getPublishedMenu(@Query("menuId") menuId?: string) {
    return this.catalog.getPublishedMenu(menuId);
  }

  @Get("combos/:id")
  getPublishedCombo(
    @Param("id") id: string,
    @Query("menuId") menuId?: string,
  ) {
    return this.catalog.getPublishedCombo(id, menuId);
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("categories/:id")
  updateCategory(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("versions/:id/clone")
  cloneVersion(@Param("id") id: string) {
    return this.catalog.cloneVersion(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("versions/:id/schedule")
  schedule(@Param("id") id: string, @Body() dto: ScheduleMenuDto) {
    return this.catalog.schedulePublish(id, dto.scheduledPublishAt);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("versions/:id/categories")
  categories(@Param("id") id: string, @Query() query: CatalogListDto) {
    return this.management.listCategories(id, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("categories/:id")
  category(@Param("id") id: string) {
    return this.management.category(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete("categories/:id")
  removeCategory(@Param("id") id: string) {
    return this.management.removeCategory(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("categories/:id/status")
  categoryStatus(@Param("id") id: string, @Body() dto: ActiveStatusDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("versions/:id/items")
  items(@Param("id") id: string, @Query() query: CatalogListDto) {
    return this.management.listItems(id, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get("items/:id")
  item(@Param("id") id: string) {
    return this.management.item(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete("items/:id")
  removeItem(@Param("id") id: string) {
    return this.management.removeItem(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("items/:id/status")
  itemStatus(@Param("id") id: string, @Body() dto: ActiveStatusDto) {
    return this.catalog.updateItem(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch("versions/:id")
  updateVersion(@Param("id") id: string, @Body() dto: UpdateVersionDto) {
    return this.management.updateVersion(id, dto.notes);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete("versions/:id")
  removeVersion(@Param("id") id: string) {
    return this.management.removeVersion(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post("versions/:id/products")
  attachProduct(@Param("id") id: string, @Body() dto: AddProductToMenuDto) {
    return this.catalog.attachProduct(id, dto);
  }
}
