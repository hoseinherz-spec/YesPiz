import {
  BadRequestException,
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

  async publish(versionId: string) {
    const doc = await this.versions.findById(versionId).exec();
    if (!doc) throw new NotFoundException("errors.notFound");
    if (
      !(await this.items.exists({ menuVersionId: doc._id, isActive: true }))
    ) {
      throw new BadRequestException(
        "Add an active menu item before publishing.",
      );
    }
    await this.versions
      .updateMany({ published: true }, { published: false })
      .exec();
    doc.published = true;
    doc.publishedAt = new Date();
    await doc.save();
    return doc;
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
    return this.items.create({
      menuVersionId: new Types.ObjectId(versionId),
      categoryId: category._id,
      name: dto.name,
      description: dto.description ?? "",
      priceCents: dto.priceCents,
      prepWeight: dto.prepWeight ?? 1,
      imageUrl: dto.imageUrl,
      tags: dto.tags ?? [],
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
    const item = await this.items
      .findByIdAndUpdate(itemId, { $set: dto }, { new: true })
      .exec();
    if (!item) throw new NotFoundException("errors.notFound");
    return item;
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
      this.items.find({ menuVersionId: version._id, isActive: true }).exec(),
    ]);
    return {
      version: {
        id: version.id,
        version: version.version,
        publishedAt: version.publishedAt,
      },
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sortOrder,
      })),
      items: items.map((i) => ({
        id: i.id,
        categoryId: String(i.categoryId),
        name: i.name,
        description: i.description,
        priceCents: i.priceCents,
        prepWeight: i.prepWeight,
        imageUrl: i.imageUrl,
        tags: i.tags,
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
        categoryId: String(i.categoryId),
        name: i.name,
        description: i.description,
        priceCents: i.priceCents,
        prepWeight: i.prepWeight,
        imageUrl: i.imageUrl,
        tags: i.tags,
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
    const version = await this.versions.findOne({ published: true }).exec();
    return version?.version ?? null;
  }

  async getActiveItemsByIds(itemIds: string[], menuVersion: number) {
    const version = await this.versions
      .findOne({ version: menuVersion, published: true })
      .exec();
    if (!version) {
      throw new BadRequestException("errors.badRequest");
    }
    const items = await this.items
      .find({
        _id: { $in: itemIds.map((id) => new Types.ObjectId(id)) },
        menuVersionId: version._id,
        isActive: true,
      })
      .exec();
    return { version, items };
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
