import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Module,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { InjectModel, MongooseModule } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  MenuItem,
  MenuItemDocument,
  MenuItemSchema,
  MenuVersion,
  MenuVersionDocument,
  MenuVersionSchema,
} from "../catalog/schemas/menu.schema";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
class IngredientDto {
  @IsString() @MaxLength(80) name!: string;
  @IsNumber() @Min(0.01) @Max(100000) weightGrams!: number;
}
class ChoiceDto {
  @IsIn(["size", "extra", "variant", "option"]) kind!:
    "size" | "extra" | "variant" | "option";
  @IsString() @MaxLength(121) key!: string;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients!: IngredientDto[];
}
class RecipeDto {
  @IsInt() @Min(0) revision!: number;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ChoiceDto)
  choices!: ChoiceDto[];
}
@Controller("inventory-recipes")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
class RecipesController {
  constructor(
    @InjectModel(MenuItem.name) private items: Model<MenuItemDocument>,
    @InjectModel(MenuVersion.name) private versions: Model<MenuVersionDocument>,
  ) {}
  @Get() async list() {
    const version = await this.versions
      .findOne({ published: true })
      .sort({ version: -1 });
    if (!version) return [];
    const items = await this.items
      .find({ menuVersionId: version._id, isActive: true })
      .select(
        "name recipeIngredients recipeChoices recipeRevision customization",
      )
      .lean();
    return items.map((i) => ({
      id: String(i._id),
      name: i.name,
      revision: i.recipeRevision ?? 0,
      base: i.recipeIngredients,
      choices: i.recipeChoices ?? [],
      variants:
        i.customization?.variants.map((v) => ({ key: v.id, name: v.name })) ??
        [],
      options:
        i.customization?.groups.flatMap((g) =>
          g.options.map((o) => ({
            key: `${g.id}/${o.id}`,
            name: `${g.name}: ${o.name}`,
          })),
        ) ?? [],
    }));
  }
  @Post(":id") async save(@Param("id") id: string, @Body() dto: RecipeDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException("Invalid pizza.");
    if (
      dto.choices.some(
        (c) =>
          !c.key.trim() ||
          !c.ingredients.length ||
          c.ingredients.some((i) => !i.name.trim()),
      ) ||
      new Set(dto.choices.map((c) => `${c.kind}:${c.key}`)).size !==
        dto.choices.length
    )
      throw new BadRequestException(
        "Use unique choices and a measured recipe for each choice.",
      );
    const filter =
      dto.revision === 0
        ? {
            $or: [
              { recipeRevision: 0 },
              { recipeRevision: { $exists: false } },
            ],
          }
        : { recipeRevision: dto.revision };
    const item = await this.items.findOneAndUpdate(
      { _id: id, ...filter },
      { $set: { recipeChoices: dto.choices }, $inc: { recipeRevision: 1 } },
      { new: true },
    );
    if (!item)
      throw new ConflictException("Recipe changed. Refresh before saving.");
    return { saved: true, revision: item.recipeRevision };
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: MenuVersion.name, schema: MenuVersionSchema },
    ]),
  ],
  controllers: [RecipesController],
})
export class RecipesModule {}
