import { resolveCombo, type ComboComponentDto } from "./combo";
import { validateToppingImage } from "./ingredient-options";
import {
  ProductsService,
  catalogId,
  rejectNulls,
} from "./products/products.service";
import {
  productProjection,
  legacyProductContent,
  productContentKeys,
} from "./products/product-projection";
import { Menu, MenuDocument } from "./schemas/menu.schema";
import { AddProductToMenuDto } from "./dto/management.dto";
import { IngredientsService } from "./ingredients.service";
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
    private readonly ingredientLibrary: IngredientsService,
    @InjectModel(Provider.name)
    private readonly providers: Model<ProviderDocument>,
    @InjectModel(MenuVersion.name)
    private readonly versions: Model<MenuVersionDocument>,
    @InjectModel(Category.name)
    private readonly categories: Model<CategoryDocument>,
    @InjectModel(MenuItem.name)
    private readonly items: Model<MenuItemDocument>,
    private readonly products: ProductsService,
    @InjectModel(Menu.name) private readonly menus: Model<MenuDocument>,
  ) {}

  async createVersion(dto: CreateMenuVersionDto) {
    const menu = dto.menuId
      ? await this.menus
          .findOne({ _id: catalogId(dto.menuId), deletedAt: null })
          .exec()
      : await this.defaultMenu();
    if (!menu || menu.deletedAt) throw new NotFoundException("Menu not found.");
    for (let attempt = 0; attempt < 5; attempt++) {
      const last = await this.versions.findOne().sort({ version: -1 }).exec();
      try {
        return await this.versions.create({
          version: (last?.version ?? 0) + 1,
          menuId: menu._id,
          published: false,
          notes: dto.notes ?? "",
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
    }
    throw new ConflictException("Concurrent version creation. Retry.");
  }

  async listVersions() {
    return this.versions.find({ deletedAt: null }).sort({ version: -1 }).exec();
  }

  async publish(versionId: string, expectedSchedule?: Date) {
    const owner = randomUUID();
    if (!(await this.redis.acquireLock("catalog:publish", owner, 60000)))
      throw new ConflictException(
        "Another menu is being published. Please retry.",
      );
    try {
      const doc = await this.versions
        .findOne({ _id: catalogId(versionId), deletedAt: null })
        .exec();
      if (!doc) throw new NotFoundException("errors.notFound");
      if (
        expectedSchedule &&
        doc.scheduledPublishAt?.getTime() !== expectedSchedule.getTime()
      )
        return doc;
      if (
        doc.menuId &&
        !(await this.menus.exists({ _id: doc.menuId, deletedAt: null }))
      )
        throw new NotFoundException("Menu not found.");
      const categories = await this.categories
        .find({ menuVersionId: doc._id, isActive: true, deletedAt: null })
        .exec();
      if (
        !(
          await this.sellable(
            await this.items
              .find({
                $or: [
                  { categoryId: { $in: categories.map((c) => c._id) } },
                  {
                    additionalCategoryIds: {
                      $in: categories.map((c) => c._id),
                    },
                  },
                ],
                menuVersionId: doc._id,
                isActive: true,
                productType: { $ne: "unclassified" },
                deletedAt: null,
              })
              .exec(),
          )
        ).length
      ) {
        throw new BadRequestException(
          "Add an active menu item before publishing.",
        );
      }
      const published = await this.versions
        .findOneAndUpdate(
          { _id: doc._id, deletedAt: null },
          {
            $set: { published: true, publishedAt: new Date() },
            $unset: { scheduledPublishAt: "", publishError: "" },
          },
          { new: true },
        )
        .exec();
      if (!published)
        throw new ConflictException(
          "Menu version was deleted while publishing.",
        );
      // One atomic pointer switch is the source of truth for the live version.
      if (doc.menuId) {
        const switched = await this.menus.updateOne(
          { _id: doc.menuId, deletedAt: null },
          { $set: { publishedVersionId: doc._id } },
        );
        if (!switched.matchedCount)
          throw new ConflictException("Menu was deleted while publishing.");
      }
      await this.versions
        .updateMany(
          {
            _id: { $ne: doc._id },
            published: true,
            ...(doc.menuId ? { menuId: doc.menuId } : { menuId: null }),
          },
          { published: false },
        )
        .exec();
      return published;
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
      .find({
        deletedAt: null,
        published: false,
        scheduledPublishAt: { $lte: new Date() },
      })
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
    rejectNulls(dto);
    if (!dto.name.trim())
      throw new BadRequestException("Category name cannot be blank.");
    await this.requireVersion(versionId);
    return this.categories.create({
      menuVersionId: new Types.ObjectId(versionId),
      name: dto.name,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  async addItem(versionId: string, dto: CreateMenuItemDto) {
    rejectNulls(dto);
    await this.requireVersion(versionId);
    const category = await this.categories
      .findOne({ _id: catalogId(dto.categoryId), deletedAt: null })
      .exec();
    if (!category || String(category.menuVersionId) !== versionId) {
      throw new BadRequestException("errors.badRequest");
    }
    await this.validateCategories(versionId, dto.additionalCategoryIds ?? []);
    const comboComponents = await this.comboContents(versionId, dto.productType ?? "pizza", dto.comboComponents, dto.customization);
    const normalized = {
      ...dto,
      productType: dto.productType ?? "pizza",
      ingredientIds: await this.ingredientLibrary.validateIds(
        dto.ingredientIds ?? [],
      ),
    };
    if (dto.presentation) validatePresentation(dto.presentation);
    if (dto.customization) validateCustomization(dto.customization);
    const ingredientOptions = await this.ingredientLibrary.configureOptions(
      dto.ingredientOptions ?? [],
      normalized.ingredientIds,
    );
    validateToppingImage(dto.toppingBaseImageUrl);
    const created = await this.products.create({
      ...legacyProductContent(normalized as unknown as MenuItem),
      type: normalized.productType,
      status: "active",
    });
    return this.items.create({
      ...productProjection(created.revision),
      comboComponents,
      ingredientOptions,
      toppingBaseImageUrl: dto.toppingBaseImageUrl,
      additionalCategoryIds: [...new Set(dto.additionalCategoryIds ?? [])],
      pizzaId: String(created.product._id),
      presentation: dto.presentation
        ? validatePresentation(dto.presentation)
        : undefined,
      customization: dto.customization
        ? validateCustomization(dto.customization)
        : undefined,
      sortOrder: dto.sortOrder ?? 0,
      productType: normalized.productType,
      menuVersionId: new Types.ObjectId(versionId),
      categoryId: category._id,
      priceCents: dto.priceCents,
      isActive: dto.isActive ?? true,
    });
  }

  async updateItem(itemId: string, dto: UpdateMenuItemDto) {
    rejectNulls(dto);
    const existing = await this.items
      .findOne({ _id: catalogId(itemId), deletedAt: null })
      .exec();
    if (!existing) throw new NotFoundException("Menu item not found.");
    await this.requireVersion(String(existing.menuVersionId));
    const comboComponents = dto.comboComponents !== undefined || dto.customization !== undefined
      ? await this.comboContents(String(existing.menuVersionId), existing.productType, dto.comboComponents ?? existing.comboComponents, dto.customization ?? existing.customization)
      : existing.comboComponents;
    if (dto.productType && dto.productType !== existing.productType)
      throw new BadRequestException(
        "Product type cannot be changed. Create another product.",
      );
    if (
      dto.productRevisionId &&
      productContentKeys.some((key) => dto[key] !== undefined)
    )
      throw new BadRequestException(
        "Choose a revision or edit content, not both.",
      );
    if (dto.ingredientIds !== undefined)
      dto.ingredientIds = await this.ingredientLibrary.validateIds(
        dto.ingredientIds,
      );
    if (dto.presentation)
      dto.presentation = validatePresentation(dto.presentation);
    if (dto.customization)
      dto.customization = validateCustomization(dto.customization);
    if (dto.categoryId || dto.additionalCategoryIds) {
      const current = await this.items.findById(itemId).exec();
      const category = dto.categoryId
        ? await this.categories
            .findOne({ _id: catalogId(dto.categoryId), deletedAt: null })
            .exec()
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
    validateToppingImage(dto.toppingBaseImageUrl);
    let projection = {};
    if (dto.productRevisionId) {
      if (!existing.productId) await this.migrateItem(existing);
      const { revision } = await this.products.getRevision(
        String(existing.productId),
        dto.productRevisionId,
        true,
      );
      projection = productProjection(revision);
      if (!dto.presentation && existing.presentation)
        dto.presentation = {
          ...existing.presentation,
          gallery: revision.content.gallery ?? [],
        };
    } else if (productContentKeys.some((key) => dto[key] !== undefined)) {
      if (!existing.productId) await this.migrateItem(existing);
      const { product } = await this.products.get(String(existing.productId));
      const merged = {
        ...existing.toObject(),
        ...dto,
        preparation: undefined,
      } as unknown as MenuItem;
      const updated = await this.products.update(String(existing.productId), {
        ...legacyProductContent(merged),
        preparation: {
          ...legacyProductContent(merged).preparation!,
          mode:
            existing.preparation?.mode ??
            legacyProductContent(merged).preparation!.mode,
        },
        expectedRevisionId: String(product.currentRevisionId),
      });
      projection = productProjection(updated.revision);
    }
    const baseIds = (
      ("ingredientIds" in projection
        ? projection.ingredientIds
        : (dto.ingredientIds ?? existing.ingredientIds)) as Array<unknown>
    ).map(String);
    const ingredientOptions = await this.ingredientLibrary.configureOptions(
      dto.ingredientOptions ?? existing.ingredientOptions ?? [],
      baseIds,
    );
    const item = await this.items
      .findOneAndUpdate(
        {
          _id: existing._id,
          deletedAt: null,
          productRevisionId: existing.productRevisionId,
        },
        { $set: { ...dto, ...projection, ingredientOptions, comboComponents } },
        { new: true, runValidators: true },
      )
      .exec();
    if (!item)
      throw new ConflictException("Menu item changed. Refresh before saving.");
    return item;
  }

  private async comboContents(versionId: string, type: string, choices?: ComboComponentDto[], customization?: unknown) {
    if (type !== "combo") {
      if (choices?.length) throw new BadRequestException("Only combos can include products.");
      return undefined;
    }
    if (customization) throw new BadRequestException("Set the price and sizes directly on the combo.");
    const items = await this.items.find({ menuVersionId: catalogId(versionId), deletedAt: null, isActive: true }).exec();
    return resolveCombo(choices ?? [], items);
  }

  private async validateCategories(versionId: string, ids: string[]) {
    const categories = await this.categories
      .find({ _id: { $in: ids }, menuVersionId: versionId, deletedAt: null })
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
    rejectNulls(dto);
    if (dto.name !== undefined && !dto.name.trim())
      throw new BadRequestException("Category name cannot be blank.");
    const existing = await this.categories
      .findOne({ _id: catalogId(id), deletedAt: null })
      .exec();
    if (!existing) throw new NotFoundException("Category not found.");
    await this.requireVersion(String(existing.menuVersionId));
    const category = await this.categories
      .findOneAndUpdate(
        { _id: catalogId(id), deletedAt: null },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .exec();
    if (!category) throw new NotFoundException("errors.notFound");
    return category;
  }

  async cloneVersion(id: string) {
    const source = await this.requireVersion(id);
    const target = await this.createVersion({
      notes: `Copy of v${source.version}`,
      menuId: source.menuId ? String(source.menuId) : undefined,
    });
    const categories = await this.categories
      .find({ menuVersionId: source._id, deletedAt: null })
      .exec();
    const items = await this.items
      .find({ menuVersionId: source._id, deletedAt: null })
      .exec();
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
    const itemMap = new Map(items.map(item => [item.id, new Types.ObjectId()]));
    for (const item of items) {
      if (!item.productId && item.productType !== "unclassified")
        await this.migrateItem(item);
      const { _id, __v, ...fields } = item.toObject();
      const copy = await this.items.create({
        ...fields,
        _id: itemMap.get(item.id),
        comboComponents: item.comboComponents?.map(c => ({ ...c, menuItemId: String(itemMap.get(c.menuItemId) ?? c.menuItemId) })),
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

  async getPublishedMenu(menuId?: string, fromVersion?: number) {
    if (fromVersion !== undefined) {
      const original = await this.versions
        .findOne({ version: fromVersion })
        .exec();
      if (!original) return { version: null, categories: [], items: [] };
      menuId = original.menuId ? String(original.menuId) : undefined;
    }
    const version = await this.publishedVersion(menuId);
    if (!version) {
      return { version: null, categories: [], items: [] };
    }
    const [categories, candidates] = await Promise.all([
      this.categories
        .find({ menuVersionId: version._id, isActive: true, deletedAt: null })
        .sort({ sortOrder: 1 })
        .exec(),
      this.items
        .find({
          menuVersionId: version._id,
          isActive: true,
          productType: { $ne: "unclassified" },
          deletedAt: null,
        })
        .exec(),
    ]);
    const items = await this.includeBaseIngredientsAsOptions(
      await this.sellable(candidates),
    );
    const ingredientMap = await this.ingredientLibrary.resolve(
      items.flatMap((i) => (i.ingredientIds ?? []).map(String)),
    );
    const details = (item: MenuItemDocument) =>
      (item.ingredientIds ?? []).flatMap((id) => {
        const ingredient = ingredientMap.get(String(id));
        return ingredient ? [ingredient] : [];
      });
    return {
      version: {
        id: version.id,
        menuId: version.menuId ? String(version.menuId) : undefined,
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
          comboComponents: i.comboComponents,
          pizzaId: i.pizzaId ?? i.id,
          ingredientOptions: i.ingredientOptions ?? [],
          toppingBaseImageUrl: i.toppingBaseImageUrl,
          productId: i.productId ? String(i.productId) : undefined,
          productRevisionId: i.productRevisionId
            ? String(i.productRevisionId)
            : undefined,
          productType: i.productType,
          attributes: i.attributes ?? {},
          attributesSchemaVersion: i.attributesSchemaVersion ?? 1,
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
          ingredientIds: (i.ingredientIds ?? []).map(String),
          ingredientDetails: details(i),
          ingredients: i.ingredientIds?.length
            ? details(i).map((ingredient) => ingredient.name)
            : (i.ingredients ?? []),
          allergens: i.allergens ?? [],
        })),
    };
  }

  async getPublishedCombo(id: string, menuId?: string) {
    const menu = (await this.getPublishedMenu(menuId)) as unknown as {
      version: { id: string; version: number; publishedAt?: Date } | null;
      items: Array<{ id: string; productType: string } & Record<string, unknown>>;
    };
    const combo = menu.items.find(
      (item) => item.id === id && item.productType === "combo",
    );
    if (!combo) throw new NotFoundException("Combo not found.");
    if (!menu.version) throw new NotFoundException("Combo not found.");
    return { version: menu.version, item: combo };
  }

  async getVersionDetail(versionId: string) {
    const version = await this.requireVersion(versionId);
    const [categories, items] = await Promise.all([
      this.categories
        .find({ menuVersionId: version._id, deletedAt: null })
        .sort({ sortOrder: 1 })
        .exec(),
      this.items.find({ menuVersionId: version._id, deletedAt: null }).exec(),
    ]);
    const ingredientMap = await this.ingredientLibrary.resolve(
      items.flatMap((i) => (i.ingredientIds ?? []).map(String)),
    );
    await this.includeBaseIngredientsAsOptions(items);
    const details = (item: MenuItemDocument) =>
      (item.ingredientIds ?? []).flatMap((id) => {
        const ingredient = ingredientMap.get(String(id));
        return ingredient ? [ingredient] : [];
      });
    return {
      version: {
        id: version.id,
        menuId: version.menuId ? String(version.menuId) : undefined,
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
        comboComponents: i.comboComponents,
        pizzaId: i.pizzaId ?? i.id,
        ingredientOptions: i.ingredientOptions ?? [],
        toppingBaseImageUrl: i.toppingBaseImageUrl,
        productId: i.productId ? String(i.productId) : undefined,
        productRevisionId: i.productRevisionId
          ? String(i.productRevisionId)
          : undefined,
        productType: i.productType,
        attributes: i.attributes ?? {},
        attributesSchemaVersion: i.attributesSchemaVersion ?? 1,
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
        ingredientIds: (i.ingredientIds ?? []).map(String),
        ingredientDetails: details(i),
        ingredients: i.ingredientIds?.length
          ? details(i).map((ingredient) => ingredient.name)
          : (i.ingredients ?? []),
        allergens: i.allergens ?? [],
        isActive: i.isActive,
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
    const version = await this.publishedVersion();
    return version?.version ?? null;
  }

  async getActiveItemsByIds(
    itemIds: string[],
    menuVersion: number,
    at = new Date(),
  ) {
    const version = await this.versions
      .findOne({ version: menuVersion, published: true, deletedAt: null })
      .exec();
    if (!version || !(await this.menuEnabled(version.menuId, version._id))) {
      throw new BadRequestException(
        "The menu has changed. Please refresh your cart.",
      );
    }
    const items = await this.items
      .find({
        _id: { $in: itemIds.map((id) => new Types.ObjectId(id)) },
        menuVersionId: version._id,
        isActive: true,
        productType: { $ne: "unclassified" },
        deletedAt: null,
      })
      .exec();
    const activeCategories = await this.categories
      .find({ menuVersionId: version._id, isActive: true, deletedAt: null })
      .exec();
    const available = (await this.sellable(items, at)).filter(
        (i) =>
          pizzaAvailable(i.presentation, at) &&
          activeCategories.some(
            (c) =>
              c.id === String(i.categoryId) ||
              (i.additionalCategoryIds ?? []).map(String).includes(c.id),
          ),
      );
    return {
      version,
      items: await this.includeBaseIngredientsAsOptions(available),
    };
  }

  private async includeBaseIngredientsAsOptions(items: MenuItemDocument[]) {
    const ingredientMap = await this.ingredientLibrary.resolve(
      items.flatMap((item) => (item.ingredientIds ?? []).map(String)),
    );
    for (const item of items) {
      const configured = item.ingredientOptions ?? [];
      const configuredIds = new Set(
        configured.map((option) => option.ingredientId),
      );
      const defaults = (item.ingredientIds ?? []).flatMap((id) => {
        const ingredientId = String(id);
        const ingredient = ingredientMap.get(ingredientId);
        if (!ingredient || configuredIds.has(ingredientId)) return [];
        const recipeWeight = item.recipeIngredients?.find(
          (entry) =>
            entry.name.trim().toLowerCase() ===
            ingredient.name.trim().toLowerCase(),
        )?.weightGrams;
        return [
          {
            ingredientId,
            name: ingredient.name,
            image: ingredient.image,
            includedByDefault: true,
            priceCents: 0,
            portionGrams:
              recipeWeight && recipeWeight > 0 ? recipeWeight : 1,
          },
        ];
      });
      item.ingredientOptions = [...configured, ...defaults];
    }
    return items;
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
    const doc = await this.versions
      .findOne({ _id: catalogId(versionId), deletedAt: null })
      .exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    if (
      doc.menuId &&
      !(await this.menus.exists({ _id: doc.menuId, deletedAt: null }))
    )
      throw new NotFoundException("Menu not found.");
    return doc;
  }

  async defaultMenu() {
    return this.menus
      .findOneAndUpdate(
        { legacyKey: "default" },
        { $setOnInsert: { name: "Main menu", isActive: true } },
        { upsert: true, new: true },
      )
      .exec();
  }
  private async menuEnabled(
    menuId?: Types.ObjectId,
    versionId?: Types.ObjectId,
  ) {
    return (
      !menuId ||
      !!(await this.menus.exists({
        _id: menuId,
        isActive: true,
        deletedAt: null,
        ...(versionId
          ? {
              $or: [
                { publishedVersionId: versionId },
                { publishedVersionId: null },
              ],
            }
          : {}),
      }))
    );
  }
  private async publishedVersion(menuId?: string) {
    const menu = menuId
      ? await this.menus
          .findOne({ _id: catalogId(menuId), isActive: true, deletedAt: null })
          .exec()
      : await this.menus
          .findOne({ legacyKey: "default", isActive: true, deletedAt: null })
          .exec();
    if (menuId && !menu) return null;
    if (!menu && (await this.menus.exists({ legacyKey: "default" })))
      return null;
    if (menu?.publishedVersionId)
      return this.versions
        .findOne({
          _id: menu.publishedVersionId,
          menuId: menu._id,
          deletedAt: null,
        })
        .exec();
    return this.versions
      .findOne({
        published: true,
        deletedAt: null,
        ...(menu
          ? {
              $or: [
                { menuId: menu._id },
                ...(menu.legacyKey === "default" ? [{ menuId: null }] : []),
              ],
            }
          : { menuId: null }),
      })
      .sort({ version: -1 })
      .exec();
  }
  private async sellable(items: MenuItemDocument[], at = new Date()) {
    const active = await this.products.activeIds(
      items.flatMap((i) => (i.productId ? [String(i.productId)] : [])),
    );
    const available = items.filter((i) => !i.productId || active.has(String(i.productId)));
    const result: MenuItemDocument[] = [];
    for (const item of available) {
      if (item.productType !== "combo") { result.push(item); continue; }
      const componentIds = item.comboComponents?.map(c => c.menuItemId) ?? [];
      if (!componentIds.length) continue;
      const components = await this.items.find({ _id: { $in: componentIds }, menuVersionId: item.menuVersionId, isActive: true, deletedAt: null, productType: { $nin: ["combo", "unclassified"] } }).exec();
      const activeComponents = await this.sellable(components, at);
      const categories = await this.categories.find({ menuVersionId: item.menuVersionId, isActive: true, deletedAt: null }).exec();
      try {
        resolveCombo(item.comboComponents ?? [], activeComponents.filter(c => pizzaAvailable(c.presentation, at) && categories.some(category => String(category._id) === String(c.categoryId) || c.additionalCategoryIds?.some(id => String(id) === String(category._id)))));
        result.push(item);
      } catch (error) { if (!(error instanceof BadRequestException)) throw error; }
    }
    return result;
  }

  async attachProduct(versionId: string, dto: AddProductToMenuDto) {
    rejectNulls(dto);
    await this.requireVersion(versionId);
    if (!!dto.productId === !!dto.product)
      throw new BadRequestException(
        "Provide either productId or a new product.",
      );
    if (dto.product && dto.productRevisionId)
      throw new BadRequestException(
        "New products cannot reference an existing revision.",
      );
    await this.validateCategories(versionId, [
      ...new Set([dto.categoryId, ...(dto.additionalCategoryIds ?? [])]),
    ]);
    const customization = dto.customization
      ? validateCustomization(dto.customization)
      : undefined;
    const presentation = dto.presentation
      ? validatePresentation(dto.presentation)
      : undefined;
    const { product, revision } = dto.productId
      ? await this.products.getRevision(
          dto.productId,
          dto.productRevisionId,
          true,
        )
      : await this.products.create(dto.product!);
    const ingredientOptions = await this.ingredientLibrary.configureOptions(
      dto.ingredientOptions ?? [],
      revision.content.ingredientIds ?? [],
    );
    validateToppingImage(dto.toppingBaseImageUrl);
    return this.items.create({
      ...productProjection(revision),
      ingredientOptions,
      toppingBaseImageUrl: dto.toppingBaseImageUrl,
      menuVersionId: catalogId(versionId),
      categoryId: catalogId(dto.categoryId),
      additionalCategoryIds: dto.additionalCategoryIds ?? [],
      priceCents: dto.priceCents,
      customization,
      presentation: presentation ?? {
        gallery: revision.content.gallery ?? [],
        fields: [],
        availability: {
          enabled: false,
          timezone: "UTC",
          periods: [],
          closedDates: [],
        },
      },
      pizzaId: product.legacyPizzaId ?? product.id,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  async migrateItem(item: MenuItemDocument) {
    if (item.productId || item.productType === "unclassified") return item;
    const legacyPizzaId = item.pizzaId ?? item.id;
    let found = await this.products.products.findOne({ legacyPizzaId }).exec();
    let revision;
    if (!found) {
      try {
        const created = await this.products.create(
          {
            ...legacyProductContent(item),
            type: item.productType || "pizza",
            status: "active",
          },
          legacyPizzaId,
        );
        found = created.product;
        revision = created.revision;
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        found = await this.products.products
          .findOne({ legacyPizzaId })
          .orFail()
          .exec();
      }
    }
    if (!revision) {
      // Keep each historical item's content, even when its stable product identity is shared.
      const content = await this.products.normalize(
        found.type,
        legacyProductContent(item),
      );
      const previous = await this.products.revisions
        .findOne({ productId: found._id })
        .sort({ revision: -1 })
        .orFail()
        .exec();
      revision = await this.products.revisions.create({
        productId: found._id,
        type: found.type,
        revision: previous.revision + 1,
        attributesSchemaVersion: content.attributesSchemaVersion,
        content,
      });
    }
    await this.products.products.updateOne(
      { _id: found._id, currentRevisionId: found.currentRevisionId },
      { $set: { currentRevisionId: revision._id } },
    );
    item.set({
      productId: found._id,
      productRevisionId: revision._id,
      attributes: revision.content.attributes,
      attributesSchemaVersion: revision.attributesSchemaVersion,
      preparation: revision.content.preparation,
    });
    await item.save();
    return item;
  }
}
