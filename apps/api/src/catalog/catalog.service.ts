import {
  Provider,
  type ProviderDocument,
} from "../providers/schemas/provider.schema";
import { Cron } from "@nestjs/schedule";
import { RedisService } from "../redis/redis.service";
import {
  validatePresentation,
  pizzaAvailable,
  publicPresentation,
} from "./presentation";
import { randomUUID } from "node:crypto";
import { validateCustomization } from "./customization";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  CreateCategoryDto,
  CreateMenuItemDto,
  CreateMenuVersionDto,
  UpdateMenuItemDto,
  UpdateCategoryDto,
} from "./dto/catalog.dto";
import {
  Category,
  CategoryDocument,
  MenuItem,
  MenuItemDocument,
  MenuVersion,
  MenuVersionDocument,
} from "./schemas/menu.schema";

@Injectable()
export class CatalogService {
  constructor(
    private readonly redis: RedisService,
    @InjectModel(Provider.name)
    private readonly providers: Model<ProviderDocument>,
    @InjectModel(MenuVersion.name)
    private readonly versions: Model<MenuVersionDocument>,
    @InjectModel(Category.name)
    private readonly categories: Model<CategoryDocument>,
    @InjectModel(MenuItem.name)
    private readonly items: Model<MenuItemDocument>,
  ) {}

  async createVersion(dto: CreateMenuVersionDto) {
    const last = await this.versions.findOne().sort({ version: -1 }).exec();
    const version = (last?.version ?? 0) + 1;
    return this.versions.create({
      version,
      published: false,
      notes: dto.notes ?? "",
    });
  }

  async listVersions() {
    return this.versions.find().sort({ version: -1 }).exec();
  }

  async publish(versionId: string, expectedSchedule?: Date) {
    const owner = randomUUID();
    if (!(await this.redis.acquireLock("catalog:publish", owner, 60000)))
      throw new ConflictException(
        "Another menu is being published. Please retry.",
      );
    try {
      const doc = await this.versions.findById(versionId).exec();
      if (!doc) throw new NotFoundException("errors.notFound");
      if (
        expectedSchedule &&
        doc.scheduledPublishAt?.getTime() !== expectedSchedule.getTime()
      )
        return doc;
      const categories = await this.categories
        .find({ menuVersionId: doc._id, isActive: true })
        .exec();
      if (
        !(await this.items.exists({
          $or: [
            { categoryId: { $in: categories.map((c) => c._id) } },
            { additionalCategoryIds: { $in: categories.map((c) => c._id) } },
          ],
          menuVersionId: doc._id,
          isActive: true,
          productType: "pizza",
        }))
      ) {
        throw new BadRequestException(
          "Add an active menu item before publishing.",
        );
      }
      await this.versions
        .updateMany({ published: true }, { published: false })
        .exec();
      doc.published = true;
      doc.scheduledPublishAt = undefined;
      doc.publishError = undefined;
      doc.publishedAt = new Date();
      await doc.save();
      return doc;
    } finally {
      await this.redis.releaseLock("catalog:publish", owner);
    }
  }
  async schedulePublish(id: string, at?: string) {
    const owner = randomUUID();
    if (!(await this.redis.acquireLock("catalog:publish", owner, 60000)))
      throw new ConflictException(
        "Publication is already in progress. Refresh before changing its schedule.",
      );
    try {
      const version = await this.requireVersion(id);
      if (at && (version.published || new Date(at).getTime() <= Date.now()))
        throw new BadRequestException("Choose a future time for a draft menu.");
      version.scheduledPublishAt = at ? new Date(at) : undefined;
      version.publishError = undefined;
      return await version.save();
    } finally {
      await this.redis.releaseLock("catalog:publish", owner);
    }
  }

  @Cron("*/30 * * * * *", { name: "catalog-publication" })
  async publishScheduled() {
    const rows = await this.versions
      .find({ published: false, scheduledPublishAt: { $lte: new Date() } })
      .sort({ scheduledPublishAt: 1 })
      .exec();
    for (const row of rows) {
      try {
        await this.publish(row.id, row.scheduledPublishAt);
      } catch (error) {
        if (error instanceof ConflictException) continue;
        await this.versions
          .updateOne(
            { _id: row._id, scheduledPublishAt: row.scheduledPublishAt },
            {
              $set: {
                publishError: (error instanceof Error
                  ? error.message
                  : "Publication failed"
                ).slice(0, 300),
              },
              $unset: { scheduledPublishAt: "" },
            },
          )
          .exec();
      }
    }
  }

  async addCategory(versionId: string, dto: CreateCategoryDto) {
    await this.requireVersion(versionId);
    return this.categories.create({
      menuVersionId: new Types.ObjectId(versionId),
      name: dto.name,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  async addItem(versionId: string, dto: CreateMenuItemDto) {
    await this.requireVersion(versionId);
    const category = await this.categories.findById(dto.categoryId).exec();
    if (!category || String(category.menuVersionId) !== versionId) {
      throw new BadRequestException("errors.badRequest");
    }
    await this.validateCategories(versionId, dto.additionalCategoryIds ?? []);
    return this.items.create({
      additionalCategoryIds: [...new Set(dto.additionalCategoryIds ?? [])],
      pizzaId: randomUUID(),
      presentation: dto.presentation
        ? validatePresentation(dto.presentation)
        : undefined,
      customization: dto.customization
        ? validateCustomization(dto.customization)
        : undefined,
      sortOrder: dto.sortOrder ?? 0,
      productType: "pizza",
      menuVersionId: new Types.ObjectId(versionId),
      categoryId: category._id,
      name: dto.name,
      description: dto.description ?? "",
      priceCents: dto.priceCents,
      prepWeight: dto.prepWeight ?? 1,
      imageUrl: dto.imageUrl,
      tags: dto.tags ?? [],
      ingredients: dto.ingredients ?? [],
      allergens: dto.allergens ?? [],
      isActive: dto.isActive ?? true,
      recipeIngredients: dto.recipeIngredients ?? [],
      cookTimeSeconds: dto.cookTimeSeconds ?? 0,
      handoffTempC: dto.handoffTempC ?? 65,
      requiresNumberedSeal: dto.requiresNumberedSeal ?? true,
      requiresReadyPhoto: dto.requiresReadyPhoto ?? false,
      checklistTemplate: dto.checklistTemplate ?? [
        "Weight check",
        "Packaging seal",
        "Temperature",
      ],
    });
  }

  async updateItem(itemId: string, dto: UpdateMenuItemDto) {
    if (dto.presentation)
      dto.presentation = validatePresentation(dto.presentation);
    if (dto.customization)
      dto.customization = validateCustomization(dto.customization);
    if (dto.categoryId || dto.additionalCategoryIds) {
      const current = await this.items.findById(itemId).exec();
      const category = dto.categoryId
        ? await this.categories.findById(dto.categoryId).exec()
        : current &&
          (await this.categories.findById(current.categoryId).exec());
      if (
        !current ||
        !category ||
        String(current.menuVersionId) !== String(category.menuVersionId)
      )
        throw new BadRequestException(
          "Choose a category in this menu version.",
        );
    }
    if (dto.additionalCategoryIds) {
      const current = await this.items.findById(itemId).exec();
      if (!current) throw new NotFoundException("errors.notFound");
      await this.validateCategories(
        String(current.menuVersionId),
        dto.additionalCategoryIds,
      );
      dto.additionalCategoryIds = [...new Set(dto.additionalCategoryIds)];
    }
    const item = await this.items
      .findByIdAndUpdate(itemId, { $set: dto }, { new: true })
      .exec();
    if (!item) throw new NotFoundException("errors.notFound");
    return item;
  }

  private async validateCategories(versionId: string, ids: string[]) {
    const categories = await this.categories
      .find({ _id: { $in: ids }, menuVersionId: versionId })
      .exec();
    if (categories.length !== new Set(ids).size)
      throw new BadRequestException("Choose categories in this menu version.");
  }

  async commentAliases(itemId: string) {
    if (!Types.ObjectId.isValid(itemId)) return [itemId];
    const item = await this.items.findById(itemId).exec();
    if (!item) return [itemId];
    const pizzaId = item.pizzaId ?? item.id;
    const revisions = await this.items.find({ pizzaId }).select("_id").exec();
    return [...new Set([itemId, pizzaId, ...revisions.map((i) => i.id)])];
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categories
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!category) throw new NotFoundException("errors.notFound");
    return category;
  }

  async cloneVersion(id: string) {
    const source = await this.requireVersion(id);
    const target = await this.createVersion({
      notes: `Copy of v${source.version}`,
    });
    const categories = await this.categories
      .find({ menuVersionId: source._id })
      .exec();
    const items = await this.items.find({ menuVersionId: source._id }).exec();
    const categoryMap = new Map<string, Types.ObjectId>();
    for (const category of categories) {
      const copy = await this.categories.create({
        menuVersionId: target._id,
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      });
      categoryMap.set(category.id, copy._id);
    }
    for (const item of items) {
      const { _id, __v, ...fields } = item.toObject();
      const copy = await this.items.create({
        ...fields,
        pizzaId: item.pizzaId ?? item.id,
        menuVersionId: target._id,
        categoryId: categoryMap.get(String(item.categoryId)),
        additionalCategoryIds: (item.additionalCategoryIds ?? [])
          .map((id) => categoryMap.get(String(id)))
          .filter(Boolean),
      });
      await this.providers
        .updateMany(
          { eightySixedItemIds: item._id },
          { $addToSet: { eightySixedItemIds: copy._id } },
        )
        .exec();
    }
    return target;
  }

  async getPublishedMenu() {
    const version = await this.versions.findOne({ published: true }).exec();
    if (!version) {
      return { version: null, categories: [], items: [] };
    }
    const [categories, items] = await Promise.all([
      this.categories
        .find({ menuVersionId: version._id, isActive: true })
        .sort({ sortOrder: 1 })
        .exec(),
      this.items
        .find({
          menuVersionId: version._id,
          isActive: true,
          productType: "pizza",
        })
        .exec(),
    ]);
    return {
      version: {
        id: version.id,
        version: version.version,
        publishedAt: version.publishedAt,
      },
      categories: categories
        .filter((c) =>
          items.some(
            (i) =>
              String(i.categoryId) === c.id ||
              (i.additionalCategoryIds ?? []).map(String).includes(c.id),
          ),
        )
        .map((c) => ({
          id: c.id,
          name: c.name,
          sortOrder: c.sortOrder,
        })),
      items: items
        .filter(
          (i) =>
            pizzaAvailable(i.presentation) &&
            categories.some(
              (c) =>
                c.id === String(i.categoryId) ||
                (i.additionalCategoryIds ?? []).map(String).includes(c.id),
            ),
        )
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((i) => ({
          id: i.id,
          pizzaId: i.pizzaId ?? i.id,
          customization: i.customization,
          presentation: publicPresentation(i.presentation),
          sortOrder: i.sortOrder ?? 0,
          categoryId: String(i.categoryId),
          additionalCategoryIds: (i.additionalCategoryIds ?? []).map(String),
          name: i.name,
          description: i.description,
          priceCents: i.customization
            ? Math.min(
                ...i.customization.variants
                  .filter((v) => v.isActive)
                  .map((v) => v.priceCents),
              )
            : i.priceCents,
          prepWeight: i.prepWeight,
          imageUrl: i.imageUrl,
          tags: i.tags,
          ingredients: i.ingredients ?? [],
          allergens: i.allergens ?? [],
        })),
    };
  }

  async getVersionDetail(versionId: string) {
    const version = await this.requireVersion(versionId);
    const [categories, items] = await Promise.all([
      this.categories
        .find({ menuVersionId: version._id })
        .sort({ sortOrder: 1 })
        .exec(),
      this.items.find({ menuVersionId: version._id }).exec(),
    ]);
    return {
      version: {
        id: version.id,
        version: version.version,
        published: version.published,
        publishedAt: version.publishedAt,
        notes: version.notes,
      },
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
      })),
      items: items.map((i) => ({
        id: i.id,
        pizzaId: i.pizzaId ?? i.id,
        customization: i.customization,
        presentation: i.presentation,
        sortOrder: i.sortOrder ?? 0,
        categoryId: String(i.categoryId),
        additionalCategoryIds: (i.additionalCategoryIds ?? []).map(String),
        name: i.name,
        description: i.description,
        priceCents: i.priceCents,
        prepWeight: i.prepWeight,
        imageUrl: i.imageUrl,
        tags: i.tags,
        ingredients: i.ingredients ?? [],
        allergens: i.allergens ?? [],
        isActive: i.isActive,
        productType: i.productType,
        recipeIngredients: i.recipeIngredients ?? [],
        cookTimeSeconds: i.cookTimeSeconds ?? 0,
        handoffTempC: i.handoffTempC ?? 65,
        requiresNumberedSeal: i.requiresNumberedSeal ?? true,
        requiresReadyPhoto: i.requiresReadyPhoto ?? false,
        checklistTemplate: i.checklistTemplate ?? [],
      })),
    };
  }

  async getPublishedVersionNumber(): Promise<number | null> {
    const version = await this.versions.findOne({ published: true }).exec();
    return version?.version ?? null;
  }

  async getActiveItemsByIds(
    itemIds: string[],
    menuVersion: number,
    at = new Date(),
  ) {
    const version = await this.versions
      .findOne({ version: menuVersion, published: true })
      .exec();
    if (!version) {
      throw new BadRequestException(
        "The menu has changed. Please refresh your cart.",
      );
    }
    const items = await this.items
      .find({
        _id: { $in: itemIds.map((id) => new Types.ObjectId(id)) },
        menuVersionId: version._id,
        isActive: true,
        productType: "pizza",
      })
      .exec();
    const activeCategories = await this.categories
      .find({ menuVersionId: version._id, isActive: true })
      .exec();
    return {
      version,
      items: items.filter(
        (i) =>
          pizzaAvailable(i.presentation, at) &&
          activeCategories.some(
            (c) =>
              c.id === String(i.categoryId) ||
              (i.additionalCategoryIds ?? []).map(String).includes(c.id),
          ),
      ),
    };
  }

  /** Quality handoff uses ordered line items even if later deactivated. */
  async getItemsByIds(itemIds: string[], menuVersion: number) {
    const version = await this.versions
      .findOne({ version: menuVersion })
      .exec();
    if (!version) {
      throw new BadRequestException("errors.badRequest");
    }
    const items = await this.items
      .find({
        _id: { $in: itemIds.map((id) => new Types.ObjectId(id)) },
        menuVersionId: version._id,
      })
      .exec();
    return { version, items };
  }

  private async requireVersion(versionId: string) {
    const doc = await this.versions.findById(versionId).exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    return doc;
  }
}
