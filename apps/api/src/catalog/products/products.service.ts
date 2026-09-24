import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import {
  Product,
  ProductDocument,
  ProductRevision,
  ProductRevisionDocument,
} from "./product.schema";
import {
  CreateProductDto,
  ProductContent,
  ProductContentDto,
  UpdateProductDto,
} from "./product.dto";
import type { ProductStatus } from "./product.schema";
import { productTypes, validateAttributes } from "./product-types";
import { IngredientsService } from "../ingredients.service";

export function catalogId(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id))
    throw new BadRequestException("Invalid catalog ID.");
  return new Types.ObjectId(id);
}
export function rejectNulls(value: object) {
  if (Object.values(value).some((v) => v === null))
    throw new BadRequestException(
      "Fields cannot be null; omit unchanged fields.",
    );
}
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) readonly products: Model<ProductDocument>,
    @InjectModel(ProductRevision.name)
    readonly revisions: Model<ProductRevisionDocument>,
    private readonly ingredients: IngredientsService,
  ) {}
  async normalize(
    type: string,
    input: ProductContent,
  ): Promise<ProductContent> {
    rejectNulls(input);
    const dto = plainToInstance(ProductContentDto, input);
    // recipeChoices is an internal legacy snapshot, not a public write field.
    const { recipeChoices, ...publicContent } = input;
    if (
      validateSync(plainToInstance(ProductContentDto, publicContent), {
        whitelist: true,
        forbidNonWhitelisted: true,
      }).length
    )
      throw new BadRequestException("Invalid product content.");
    const attributes = validateAttributes(
      type,
      dto.attributes ?? {},
      dto.attributesSchemaVersion ?? 1,
    );
    const validImage = (url: string) => /^(https?:\/\/|\/(?!\/))/.test(url);
    if (
      (dto.imageUrl && !validImage(dto.imageUrl)) ||
      dto.gallery?.some((url) => !validImage(url))
    )
      throw new BadRequestException(
        "Images must use an HTTP(S) URL or an application path.",
      );
    if (!dto.name.trim())
      throw new BadRequestException("Product name cannot be blank.");
    return {
      ...publicContent,
      name: dto.name.trim(),
      description: dto.description ?? "",
      gallery: dto.gallery ?? [],
      tags: dto.tags ?? [],
      ingredients: dto.ingredients ?? [],
      allergens: dto.allergens ?? [],
      ingredientIds: await this.ingredients.validateIds(
        dto.ingredientIds ?? [],
      ),
      attributes,
      attributesSchemaVersion: dto.attributesSchemaVersion ?? 1,
      preparation: dto.preparation ?? {
        mode: productTypes[type].preparation,
        prepWeight: 1,
        cookTimeSeconds: 0,
        handoffTempC: productTypes[type].preparation === "pack" ? 0 : 65,
        requiresNumberedSeal: true,
        requiresReadyPhoto: false,
        checklistTemplate:
          productTypes[type].preparation === "pack"
            ? ["Packaging seal"]
            : ["Weight check", "Packaging seal", "Temperature"],
        recipeIngredients: [],
      },
      ...(recipeChoices ? { recipeChoices } : {}),
    };
  }
  async create(dto: CreateProductDto, legacyPizzaId?: string) {
    rejectNulls(dto);
    const { type, status, ...input } = dto;
    const content = await this.normalize(type, input);
    const productId = new Types.ObjectId();
    const revisionId = new Types.ObjectId();
    // Persist immutable content first; no visible product can point at missing content.
    const revision = await this.revisions.create({
      _id: revisionId,
      productId,
      revision: 1,
      type,
      attributesSchemaVersion: content.attributesSchemaVersion,
      content,
    });
    try {
      const product = await this.products.create({
        _id: productId,
        type,
        status: status ?? "draft",
        currentRevisionId: revisionId,
        ...(legacyPizzaId ? { legacyPizzaId } : {}),
      });
      return { product, revision };
    } catch (error) {
      await this.revisions.deleteOne({ _id: revisionId });
      throw error;
    }
  }
  async get(id: string) {
    const product = await this.products.findById(catalogId(id)).exec();
    if (!product) throw new NotFoundException("Product not found.");
    const revision = await this.revisions
      .findById(product.currentRevisionId)
      .exec();
    if (!revision) throw new ConflictException("Product revision is missing.");
    return { product, revision };
  }
  async getRevision(productId: string, revisionId?: string, forMenu = false) {
    const { product, revision: current } = await this.get(productId);
    if (forMenu && product.status === "archived")
      throw new ConflictException(
        "Archived products cannot be added to menus.",
      );
    const revision = revisionId
      ? await this.revisions
          .findOne({ _id: catalogId(revisionId), productId: product._id })
          .exec()
      : current;
    if (!revision)
      throw new BadRequestException(
        "Revision does not belong to this product.",
      );
    return { product, revision };
  }
  async listRevisions(id: string, page = 1, limit = 20) {
    const { product } = await this.get(id);
    const filter = { productId: product._id };
    const [data, total] = await Promise.all([
      this.revisions
        .find(filter)
        .sort({ revision: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.revisions.countDocuments(filter).exec(),
    ]);
    return { data, total, page, limit };
  }
  async list(query: {
    type?: string;
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1,
      limit = query.limit ?? 20;
    const match = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status
        ? { status: query.status }
        : { status: { $ne: "archived" } }),
    };
    const pipeline: import("mongoose").PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: "product_revisions",
          localField: "currentRevisionId",
          foreignField: "_id",
          as: "revision",
        },
      },
      { $unwind: "$revision" },
      ...(query.q
        ? [
            {
              $match: {
                "revision.content.name": {
                  $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                  $options: "i",
                },
              },
            },
          ]
        : []),
      { $sort: { _id: -1 } },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ];
    const [result] = await this.products.aggregate(pipeline);
    return {
      data: result.data,
      total: result.total[0]?.count ?? 0,
      page,
      limit,
    };
  }
  async update(id: string, dto: UpdateProductDto) {
    const { product, revision: previous } = await this.get(id);
    if (product.status === "archived")
      throw new ConflictException("Archived products cannot be edited.");
    if (String(previous._id) !== dto.expectedRevisionId)
      throw new ConflictException("Product changed; refresh before saving.");
    const { expectedRevisionId, ...patch } = dto;
    const content = await this.normalize(product.type, {
      ...previous.content,
      ...patch,
    });
    const latest = await this.revisions
      .findOne({ productId: product._id })
      .sort({ revision: -1 })
      .orFail()
      .exec();
    let revision: ProductRevisionDocument;
    try {
      revision = await this.revisions.create({
        productId: product._id,
        revision: latest.revision + 1,
        type: product.type,
        attributesSchemaVersion: content.attributesSchemaVersion,
        content,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException(
          "Concurrent product edit; refresh and retry.",
        );
      throw error;
    }
    const updated = await this.products
      .findOneAndUpdate(
        {
          _id: product._id,
          currentRevisionId: catalogId(expectedRevisionId),
          status: { $ne: "archived" },
        },
        { currentRevisionId: revision._id },
        { new: true },
      )
      .exec();
    if (!updated) {
      await this.revisions.deleteOne({ _id: revision._id });
      throw new ConflictException("Product changed; refresh and retry.");
    }
    return { product: updated, revision };
  }
  async setStatus(id: string, status: ProductStatus) {
    const { product } = await this.get(id);
    if (product.status === "archived")
      throw new ConflictException("Archived products cannot change status.");
    return this.products
      .findOneAndUpdate(
        { _id: product._id, status: { $ne: "archived" } },
        { status },
        { new: true },
      )
      .orFail(() => new ConflictException("Product changed."))
      .exec();
  }
  async activeIds(ids: string[]) {
    const rows = await this.products
      .find({ _id: { $in: ids }, status: "active" })
      .select("_id")
      .exec();
    return new Set(rows.map((p) => p.id));
  }
}
