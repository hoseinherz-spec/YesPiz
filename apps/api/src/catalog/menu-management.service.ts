import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Menu,
  MenuDocument,
  MenuVersion,
  MenuVersionDocument,
  Category,
  CategoryDocument,
  MenuItem,
  MenuItemDocument,
} from "./schemas/menu.schema";
import { CatalogService } from "./catalog.service";
import {
  CatalogListDto,
  CreateMenuDto,
  UpdateMenuDto,
} from "./dto/management.dto";
import { catalogId, rejectNulls } from "./products/products.service";
@Injectable()
export class MenuManagementService {
  constructor(
    @InjectModel(Menu.name) private readonly menus: Model<MenuDocument>,
    @InjectModel(MenuVersion.name)
    private readonly versions: Model<MenuVersionDocument>,
    @InjectModel(Category.name)
    private readonly categories: Model<CategoryDocument>,
    @InjectModel(MenuItem.name) private readonly items: Model<MenuItemDocument>,
    private readonly catalog: CatalogService,
  ) {}
  private async page<T>(
    model: Model<T>,
    filter: object,
    query: CatalogListDto,
  ) {
    const page = query.page ?? 1,
      limit = query.limit ?? 20;
    const match = {
      ...filter,
      deletedAt: null,
      ...(query.isActive ? { isActive: query.isActive === "true" } : {}),
      ...(query.q
        ? {
            name: {
              $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              $options: "i",
            },
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      model
        .find(match)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      model.countDocuments(match).exec(),
    ]);
    return { data, total, page, limit };
  }
  list(query: CatalogListDto) {
    return this.page<MenuDocument>(this.menus, {}, query);
  }
  async get(id: string) {
    const menu = await this.menus
      .findOne({ _id: catalogId(id), deletedAt: null })
      .exec();
    if (!menu) throw new NotFoundException("Menu not found.");
    return menu;
  }
  create(dto: CreateMenuDto) {
    rejectNulls(dto);
    if (!dto.name.trim())
      throw new BadRequestException("Menu name cannot be blank.");
    return this.menus.create({ ...dto, name: dto.name.trim() });
  }
  async update(id: string, dto: UpdateMenuDto) {
    rejectNulls(dto);
    await this.get(id);
    if (dto.name !== undefined && !dto.name.trim())
      throw new BadRequestException("Menu name cannot be blank.");
    return this.menus
      .findOneAndUpdate(
        { _id: catalogId(id), deletedAt: null },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .orFail()
      .exec();
  }
  async remove(id: string) {
    await this.get(id);
    await this.menus.updateOne(
      { _id: catalogId(id) },
      { $set: { deletedAt: new Date(), isActive: false } },
    );
    await this.versions.updateMany(
      { menuId: catalogId(id) },
      { $unset: { scheduledPublishAt: "" } },
    );
    return { deleted: true };
  }
  async listVersions(id: string) {
    await this.get(id);
    return this.versions
      .find({ menuId: catalogId(id), deletedAt: null })
      .sort({ version: -1 })
      .exec();
  }
  async version(id: string) {
    const version = await this.versions
      .findOne({ _id: catalogId(id), deletedAt: null })
      .exec();
    if (!version) throw new NotFoundException("Menu version not found.");
    if (version.menuId) await this.get(String(version.menuId));
    return version;
  }
  async updateVersion(id: string, notes: string) {
    await this.version(id);
    return this.versions
      .findByIdAndUpdate(catalogId(id), { notes }, { new: true })
      .exec();
  }
  async removeVersion(id: string) {
    const version = await this.version(id);
    if (version.published)
      throw new ConflictException(
        "Publish another version before deleting the current version.",
      );
    await this.versions.updateOne(
      { _id: version._id, published: false },
      { $set: { deletedAt: new Date() }, $unset: { scheduledPublishAt: "" } },
    );
    return { deleted: true };
  }
  async listCategories(versionId: string, query: CatalogListDto) {
    await this.version(versionId);
    return this.page<CategoryDocument>(
      this.categories,
      { menuVersionId: catalogId(versionId) },
      query,
    );
  }
  async category(id: string) {
    const category = await this.categories
      .findOne({ _id: catalogId(id), deletedAt: null })
      .exec();
    if (!category) throw new NotFoundException("Category not found.");
    await this.version(String(category.menuVersionId));
    return category;
  }
  async removeCategory(id: string) {
    const category = await this.category(id);
    if (
      await this.items.exists({
        deletedAt: null,
        $or: [
          { categoryId: category._id },
          { additionalCategoryIds: category._id },
        ],
      })
    )
      throw new ConflictException(
        "Move or delete the items in this category first.",
      );
    await this.categories.updateOne(
      { _id: category._id },
      { $set: { deletedAt: new Date(), isActive: false } },
    );
    return { deleted: true };
  }
  async listItems(versionId: string, query: CatalogListDto) {
    await this.version(versionId);
    return this.page<MenuItemDocument>(
      this.items,
      {
        menuVersionId: catalogId(versionId),
        ...(query.type ? { productType: query.type } : {}),
        ...(query.categoryId
          ? {
              $or: [
                { categoryId: catalogId(query.categoryId) },
                { additionalCategoryIds: catalogId(query.categoryId) },
              ],
            }
          : {}),
      },
      query,
    );
  }
  async item(id: string) {
    const item = await this.items
      .findOne({ _id: catalogId(id), deletedAt: null })
      .exec();
    if (!item) throw new NotFoundException("Menu item not found.");
    await this.version(String(item.menuVersionId));
    return item;
  }
  async removeItem(id: string) {
    const item = await this.item(id);
    await this.items.updateOne(
      { _id: item._id },
      { $set: { deletedAt: new Date(), isActive: false } },
    );
    return { deleted: true };
  }
  /** Explicit, resumable migration; never mutates orders or removes legacy fields. */
  async migrateLegacy() {
    const menu = await this.catalog.defaultMenu();
    await this.versions.updateMany(
      { menuId: null },
      { $set: { menuId: menu._id } },
    );
    let migrated = 0;
    for await (const item of this.items
      .find({ productId: null, productType: { $ne: "unclassified" } })
      .sort({ menuVersionId: 1, _id: 1 })
      .cursor()) {
      await this.catalog.migrateItem(item);
      migrated++;
    }
    return { menuId: menu.id, migrated };
  }
}
