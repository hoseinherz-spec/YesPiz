import {
  Body,
  Controller,
  Delete,
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
import { IngredientsService } from "./ingredients.service";
import { CreateIngredientDto, UpdateIngredientDto } from "./dto/ingredient.dto";
@ApiTags("ingredients")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("catalog/ingredients")
export class IngredientsController {
  constructor(private readonly ingredients: IngredientsService) {}
  @Get() list() {
    return this.ingredients.list();
  }
  @Get(":id") get(@Param("id") id: string) {
    return this.ingredients.get(id);
  }
  @Post() create(@Body() dto: CreateIngredientDto) {
    return this.ingredients.create(dto);
  }
  @Patch(":id") update(
    @Param("id") id: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.ingredients.update(id, dto);
  }
  @Delete(":id") remove(@Param("id") id: string) {
    return this.ingredients.remove(id);
  }
}
