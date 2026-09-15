import { RecipesModule } from "./recipes.module";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Logger,
  Module,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { InjectModel, MongooseModule } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Cron } from "@nestjs/schedule";
import {
  Order,
  OrderDocument,
  OrderSchema,
} from "../orders/schemas/order.schema";
import { OrderStatus } from "../common/enums";
import { Type } from "class-transformer";
import {
  Provider,
  ProviderDocument,
  ProviderSchema,
} from "../providers/schemas/provider.schema";
import { type OrderLine } from "../orders/schemas/order.schema";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
export const ingredientKey = (name: string) =>
  Buffer.from(name.trim().toLowerCase()).toString("base64url");
export function ingredientDemand(lines: OrderLine[]) {
  const result: Record<string, number> = {};
  for (const line of lines) {
    for (const ingredient of line.recipeSnapshot?.recipeIngredients ?? []) {
      const key = ingredientKey(ingredient.name);
      result[key] = (result[key] ?? 0) + ingredient.weightGrams * line.quantity;
    }
  }
  return result;
}
export function hasIngredients(
  provider: Pick<Provider, "inventoryEnabled" | "ingredientStock">,
  lines: OrderLine[],
) {
  if (!provider.inventoryEnabled) return true;
  if (
    lines.some(
      (l) =>
        !l.recipeSnapshot?.recipeIngredients.length ||
        l.recipeSnapshot.inventoryComplete === false ||
        (l.recipeSnapshot.inventoryComplete !== true && ((l.extras?.length ?? 0)>0 || !!l.variantId || (l.size!=null&&l.size!=="medium")))
    )
  )
    return false;
  return Object.entries(ingredientDemand(lines)).every(
    ([key, grams]) => (provider.ingredientStock?.[key] ?? 0) >= grams,
  );
}
class StockItemDto {
  @IsString() @MaxLength(80) name!: string;
  @IsNumber() @Min(0) @Max(10000000) grams!: number;
}
class StockDto {
  @IsBoolean() enabled!: boolean;
  @IsInt() @Min(0) revision!: number;
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  items!: StockItemDto[];
}
@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  constructor(
    @InjectModel(Provider.name)
    private readonly providers: Model<ProviderDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
  ) {}
  private view(p: ProviderDocument) {
    return {
      id: p.id,
      enabled: p.inventoryEnabled,
      revision: p.inventoryRevision,
      items: Object.entries(p.ingredientStock ?? {}).map(([key, grams]) => ({
        name: Buffer.from(key, "base64url").toString(),
        grams,
      })),
    };
  }
  async read(providerId: string) {
    const p = await this.providers.findById(providerId).exec();
    if (!p) throw new BadRequestException("Kitchen not found.");
    return this.view(p);
  }
  async own(userId: string) {
    const p = await this.providers.findOne({ userId }).exec();
    if (!p) throw new BadRequestException("Kitchen account not found.");
    return p.id;
  }
  async update(providerId: string, dto: StockDto) {
    if (
      dto.items.some((i) => !i.name.trim()) ||
      new Set(dto.items.map((i) => ingredientKey(i.name))).size !==
        dto.items.length
    )
      throw new BadRequestException("Use distinct ingredient names.");
    const p = await this.providers
      .findOneAndUpdate(
        {
          _id: providerId,
          ...(dto.revision === 0
            ? {
                $or: [
                  { inventoryRevision: 0 },
                  { inventoryRevision: { $exists: false } },
                ],
              }
            : { inventoryRevision: dto.revision }),
        },
        {
          $set: {
            inventoryEnabled: dto.enabled,
            ingredientStock: Object.fromEntries(
              dto.items.map((i) => [ingredientKey(i.name), i.grams]),
            ),
          },
          $inc: { inventoryRevision: 1 },
        },
        { new: true },
      )
      .exec();
    if (!p)
      throw new ConflictException("Stock changed. Refresh before saving.");
    return this.view(p);
  }
  async release(providerId: string, orderId: string) {
    const key = ingredientKey(orderId),
      path = `inventoryReservations.${key}`;
    const p = await this.providers.findById(providerId).exec(),
      reservation = p?.inventoryReservations?.[key];
    if (!reservation) return;
    await this.providers
      .updateOne(
        { _id: providerId, [path]: { $exists: true } },
        {
          $inc: {
            ...Object.fromEntries(
              Object.entries(reservation.demand).map(([k, v]) => [
                `ingredientStock.${k}`,
                v,
              ]),
            ),
            inventoryRevision: 1,
          },
          $unset: { [path]: 1 },
          $pull: { inventoryReceipts: orderId },
        },
      )
      .exec();
  }
  @Cron("15 * * * * *")
  async recoverReservations() {
    const kitchens = await this.providers
      .find({ inventoryReceipts: { $exists: true, $not: { $size: 0 } } })
      .limit(200)
      .exec();
    for (const p of kitchens) {
      for (const [key, reservation] of Object.entries(
        p.inventoryReservations ?? {},
      )) {
        // Allow in-flight assignment to finish before recovering an orphan.
        if (new Date(reservation.reservedAt).getTime() > Date.now() - 120000)
          continue;
        const orderId = Buffer.from(key, "base64url").toString();
        if (!/^[a-f0-9]{24}$/i.test(orderId)) continue;
        try {
          const order = await this.orders.findById(orderId).exec();
          if (
            !order ||
            String(order.providerId) !== p.id ||
            (order.status === OrderStatus.CANCELLED && !order.preparingAt)
          )
            await this.release(p.id, orderId);
          else if (
            [
              OrderStatus.COMPLETED,
              OrderStatus.DELIVERED,
              OrderStatus.CANCELLED,
              OrderStatus.FAILED_CASH,
            ].includes(order.status)
          )
            await this.providers
              .updateOne(
                { _id: p.id },
                {
                  $unset: { [`inventoryReservations.${key}`]: 1 },
                  $pull: { inventoryReceipts: orderId },
                },
              )
              .exec();
        } catch {
          this.logger.warn(`Inventory recovery pending for order ${orderId}`);
        }
      }
    }
  }
  async reserve(providerId: string, orderId: string, lines: OrderLine[]) {
    const p = await this.providers.findById(providerId).exec();
    if (!p) return false;
    if (p.inventoryReceipts?.includes(orderId)) return true;
    if (!hasIngredients(p, lines)) return false;
    if (!p.inventoryEnabled) return true;
    const demand = ingredientDemand(lines),
      fields = Object.entries(demand);
    const updated = await this.providers
      .findOneAndUpdate(
        {
          _id: providerId,
          inventoryEnabled: true,
          inventoryReceipts: { $ne: orderId },
          ...Object.fromEntries(
            fields.map(([k, v]) => [`ingredientStock.${k}`, { $gte: v }]),
          ),
        },
        {
          $inc: {
            ...Object.fromEntries(
              fields.map(([k, v]) => [`ingredientStock.${k}`, -v]),
            ),
            inventoryRevision: 1,
          },
          $push: { inventoryReceipts: orderId },
          $set: {
            [`inventoryReservations.${ingredientKey(orderId)}`]: {
              demand,
              reservedAt: new Date(),
            },
          },
        },
        { new: true },
      )
      .exec();
    if (updated) return true;
    const latest = await this.providers.findById(providerId).exec();
    return !!latest?.inventoryReceipts.includes(orderId);
  }
}
@Controller("inventory")
@UseGuards(JwtAuthGuard, RolesGuard)
class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get("me") @Roles(UserRole.PROVIDER) async own(
    @CurrentUser() u: JwtPayloadUser,
  ) {
    return this.inventory.read(await this.inventory.own(u.userId));
  }
  @Post("me") @Roles(UserRole.PROVIDER) async updateOwn(
    @CurrentUser() u: JwtPayloadUser,
    @Body() dto: StockDto,
  ) {
    return this.inventory.update(await this.inventory.own(u.userId), dto);
  }
  @Get(":id") @Roles(UserRole.ADMIN) read(@Param("id") id: string) {
    return this.inventory.read(id);
  }
  @Post(":id") @Roles(UserRole.ADMIN) update(
    @Param("id") id: string,
    @Body() dto: StockDto,
  ) {
    return this.inventory.update(id, dto);
  }
}
@Module({
  imports: [
    RecipesModule,
    MongooseModule.forFeature([
      { name: Provider.name, schema: ProviderSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
