import {
  IngredientOptionDto,
  validateToppingImage,
} from "./ingredient-options";
import {
  ProductRevision,
  ProductRevisionDocument,
} from "./products/product.schema";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Ingredient, IngredientDocument } from "./schemas/ingredient.schema";
import { MenuItem, MenuItemDocument } from "./schemas/menu.schema";
import { CreateIngredientDto, UpdateIngredientDto } from "./dto/ingredient.dto";

@Injectable()
export class IngredientsService {
  constructor(
    @InjectModel(Ingredient.name)
    private readonly ingredients: Model<IngredientDocument>,
    @InjectModel(MenuItem.name) private readonly items: Model<MenuItemDocument>,
    @InjectModel(ProductRevision.name)
    private readonly revisions: Model<ProductRevisionDocument>,
  ) {}
  private id(id: string) {
    if (!/^[a-f0-9]{24}$/i.test(id))
      throw new BadRequestException("Invalid ingredient ID.");
    return new Types.ObjectId(id);
  }
  serialize(row: IngredientDocument) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image: row.image,
      toppingImageUrl: row.toppingImageUrl,
      isTopping: row.isTopping,
    };
  }
  async list() {
    return (
      await this.ingredients.find({ deleted: false }).sort({ name: 1 }).exec()
    ).map((row) => this.serialize(row));
  }
  async get(id: string) {
    const row = await this.ingredients
      .findOne({ _id: this.id(id), deleted: false })
      .exec();
    if (!row) throw new NotFoundException("Ingredient not found.");
    return this.serialize(row);
  }
  private duplicate(error: unknown): never {
    if ((error as { code?: number })?.code === 11000)
      throw new ConflictException("This ingredient slug is already in use.");
    throw error;
  }
  async create(dto: CreateIngredientDto) {
    try {
      return this.serialize(await this.ingredients.create(dto));
    } catch (error) {
      this.duplicate(error);
    }
  }
  async update(id: string, dto: UpdateIngredientDto) {
    // Optional fields may be omitted, but explicit null must not erase required data.
    if (Object.values(dto).some((value) => value === null))
      throw new BadRequestException("Ingredient fields cannot be null.");
    try {
      const row = await this.ingredients
        .findOneAndUpdate(
          { _id: this.id(id), deleted: false },
          { $set: dto },
          { new: true, runValidators: true },
        )
        .exec();
      if (!row) throw new NotFoundException("Ingredient not found.");
      return this.serialize(row);
    } catch (error) {
      this.duplicate(error);
    }
  }
  async remove(id: string) {
    await this.get(id);
    if (
      (await this.items.exists({
        $or: [
          { ingredientIds: this.id(id) },
          { "ingredientOptions.ingredientId": id },
        ],
      })) ||
      (
        await this.revisions.aggregate([
          { $match: { "content.ingredientIds": id } },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "currentRevisionId",
              as: "products",
            },
          },
          {
            $match: {
              products: { $elemMatch: { status: { $ne: "archived" } } },
            },
          },
          { $limit: 1 },
        ])
      ).length > 0
    )
      throw new ConflictException(
        "This ingredient is referenced by a product or menu item and must be retained.",
      );
    // Retain the record so a concurrent pizza edit cannot create a dangling reference.
    await this.ingredients
      .updateOne({ _id: this.id(id) }, { $set: { deleted: true } })
      .exec();
    return { deleted: true };
  }
  async configureOptions(options: IngredientOptionDto[], baseIds: string[]) {
    if (
      !Array.isArray(options) ||
      options.length > 40 ||
      options.some((o) => !o) ||
      new Set(options.map((o) => o.ingredientId)).size !== options.length
    )
      throw new BadRequestException("Use unique ingredient options.");
    await this.validateIds(options.map((o) => o.ingredientId));
    const details = await this.resolve(options.map((o) => o.ingredientId));
    return options.map((option) => {
      if (
        !Number.isInteger(option.priceCents) ||
        option.priceCents < 0 ||
        option.priceCents > 100000 ||
        !Number.isFinite(option.portionGrams) ||
        option.portionGrams < 0.1 ||
        option.portionGrams > 1000
      )
        throw new BadRequestException(
          "Invalid ingredient price or portion weight.",
        );
      validateToppingImage(option.toppingImageUrl ?? undefined);
      const ingredient = details.get(option.ingredientId)!;
      if (ingredient.isTopping === false) throw new BadRequestException("Base ingredients cannot be configured as toppings.");
      return {
        ingredientId: option.ingredientId,
        name: ingredient.name,
        image: ingredient.image,
        ...((option.toppingImageUrl || ingredient.toppingImageUrl) ? { toppingImageUrl: option.toppingImageUrl || ingredient.toppingImageUrl } : {}),
        includedByDefault: baseIds.includes(option.ingredientId),
        priceCents: option.priceCents,
        portionGrams: option.portionGrams,
      };
    });
  }
  async validateIds(ids: string[]) {
    if (!Array.isArray(ids))
      throw new BadRequestException(
        "Choose ingredients from the ingredient library.",
      );
    const unique = [...new Set(ids)];
    const count = await this.ingredients
      .countDocuments({
        _id: { $in: unique.map((id) => this.id(id)) },
        deleted: false,
      })
      .exec();
    if (count !== unique.length)
      throw new BadRequestException("One or more ingredients no longer exist.");
    return unique;
  }
  async resolve(ids: string[]) {
    if (!ids.length)
      return new Map<string, ReturnType<IngredientsService["serialize"]>>();
    const rows = await this.ingredients
      .find({ _id: { $in: [...new Set(ids)] } })
      .exec();
    return new Map(rows.map((row) => [row.id, this.serialize(row)]));
  }
}
