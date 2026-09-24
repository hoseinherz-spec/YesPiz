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
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums";
import { ProductsService } from "./products.service";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductStatusDto,
} from "./product.dto";
import { CatalogListDto } from "../dto/management.dto";
import { productTypes } from "./product-types";
@ApiTags("products")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get("types") types() {
    return productTypes;
  }
  @Get() list(@Query() query: CatalogListDto) {
    return this.products.list(query);
  }
  @Post() create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }
  @Get(":id") get(@Param("id") id: string) {
    return this.products.get(id);
  }
  @Get(":id/revisions")
  revisions(@Param("id") id: string, @Query() query: CatalogListDto) {
    return this.products.listRevisions(id, query.page, query.limit);
  }
  @Get(":id/revisions/:revisionId") revision(
    @Param("id") id: string,
    @Param("revisionId") revisionId: string,
  ) {
    return this.products.getRevision(id, revisionId);
  }
  @Patch(":id") update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }
  @Patch(":id/status") status(
    @Param("id") id: string,
    @Body() dto: ProductStatusDto,
  ) {
    return this.products.setStatus(id, dto.status);
  }
  @Delete(":id") remove(@Param("id") id: string) {
    return this.products.setStatus(id, "archived");
  }
}
